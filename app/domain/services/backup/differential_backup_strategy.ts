import {
  mkdir as defaultMkdir,
  stat as defaultStat,
  unlink as defaultUnlink,
  writeFile as defaultWriteFile,
} from 'node:fs/promises'
import { join } from 'node:path'
import env from '#start/env'
import backupConfig from '#config/backup'
import { type LogService } from '#services/logging/log_service'
import { LogCategory } from '#types/logging'
import {
  createDatabaseDump as defaultCreateDatabaseDump,
  type DumpOptions,
} from '#services/backup/dump_helper'
import {
  SnapshotHelper,
  type SnapshotHelper as SnapshotHelperType,
} from '#services/backup/snapshot_helper'
import {
  StorageUploader,
  type StorageUploader as StorageUploaderType,
} from '#services/backup/storage_uploader'
import type { BackupResult, BackupContext, BackupMetadata } from '#services/backup/backup_strategy'

/**
 * DifferentialBackupStrategy — Executes a differential database backup.
 *
 * Pipeline: find last full backup → detect modified tables → pg_dump (tables only)
 * → compress → encrypt → manifest → upload.
 *
 * Falls back to FullBackupStrategy if no full backup exists. Skips entirely
 * if no tables have been modified since the last backup.
 *
 * **Dependency injection for testability**
 *
 * The optional `opts` bag accepts dependencies prefixed with `_` to distinguish
 * them from public API parameters. In production, `opts` is never passed and each
 * dependency falls back to its real implementation (e.g. `mkdir as defaultMkdir`).
 * In tests, stubs replace the real functions so no ESM-level mocking is needed.
 *
 * @example Production usage
 *   new DifferentialBackupStrategy(context, logService)
 *
 * @example Test usage
 *   new DifferentialBackupStrategy(context, logService, {
 *     _snapshotHelper: snapshotMock,
 *     _createDatabaseDump: dumpStub,
 *   })
 */
export class DifferentialBackupStrategy {
  private readonly snapshotHelper: SnapshotHelperType
  private readonly uploader: StorageUploaderType
  private readonly mkdirFn: typeof defaultMkdir
  private readonly statFn: typeof defaultStat
  private readonly unlinkFn: typeof defaultUnlink
  private readonly writeFileFn: typeof defaultWriteFile
  private readonly createDump: (options: DumpOptions, _spawn?: any) => Promise<void>

  /**
   * @param context - Backup execution context (temp dir, filename, strategy type).
   * @param logService - Application logging service.
   * @param opts - Optional dependency overrides for testing. Parameters prefixed
   * with `_` are internal — they replace real I/O with stubs in test environments.
   */
  constructor(
    private context: BackupContext,
    private logService: LogService,
    opts?: {
      _snapshotHelper?: SnapshotHelperType
      _uploader?: StorageUploaderType
      _mkdir?: typeof defaultMkdir
      _stat?: typeof defaultStat
      _unlink?: typeof defaultUnlink
      _writeFile?: typeof defaultWriteFile
      _createDatabaseDump?: (options: DumpOptions, _spawn?: any) => Promise<void>
    }
  ) {
    this.snapshotHelper = opts?._snapshotHelper ?? new SnapshotHelper()
    this.uploader = opts?._uploader ?? new StorageUploader()
    this.mkdirFn = opts?._mkdir ?? defaultMkdir
    this.statFn = opts?._stat ?? defaultStat
    this.unlinkFn = opts?._unlink ?? defaultUnlink
    this.writeFileFn = opts?._writeFile ?? defaultWriteFile
    this.createDump = opts?._createDatabaseDump ?? defaultCreateDatabaseDump
  }

  async execute(): Promise<BackupResult> {
    const startTime = Date.now()
    const tempPath = join(this.context.tempDir, this.context.filename)

    this.logService.info({
      message: 'Starting differential backup',
      category: LogCategory.SYSTEM,
      metadata: { filename: this.context.filename },
    })

    // Track all temp paths for cleanup
    const tempFiles: string[] = []

    try {
      await this.mkdirFn(this.context.tempDir, { recursive: true })

      const lastFullBackup = await this.findLastFullBackup()
      if (!lastFullBackup) {
        this.logService.warn({
          message: 'No full backup found, running full backup instead',
          category: LogCategory.SYSTEM,
        })
        // Fall through to full backup logic — regenerate the filename to match
        const fullContext: BackupContext = {
          ...this.context,
          filename: SnapshotHelper.generateFilename('full'),
          strategyType: 'full',
        }
        const { FullBackupStrategy } = await import('#services/backup/full_backup_strategy')
        return new FullBackupStrategy(fullContext, this.logService).execute()
      }

      const modifiedTables = await this.getModifiedTables(lastFullBackup.createdAt)

      if (modifiedTables.length === 0) {
        this.logService.info({
          message: 'No tables modified since last backup, skipping',
          category: LogCategory.SYSTEM,
        })
        return {
          success: true,
          filename: '',
          type: 'differential',
          size: 0,
          duration: Date.now() - startTime,
          storage: backupConfig.storage.disk,
        }
      }

      this.logService.info({
        message: 'Found modified tables',
        category: LogCategory.SYSTEM,
        metadata: { count: modifiedTables.length, tables: modifiedTables },
      })

      const dumpPath = tempPath.replace(/\.(gz\.enc|enc|gz)$/, '.sql')
      tempFiles.push(dumpPath)
      await this.createDump({
        host: env.get('PG_HOST')!,
        port: Number(env.get('PG_PORT') || 5432),
        user: env.get('PG_USER')!,
        database: env.get('PG_DB_NAME')!,
        password: env.get('PG_PASSWORD').release(),
        outputPath: dumpPath,
        tables: modifiedTables,
      })

      const compressedPath = await this.snapshotHelper.compress(dumpPath)
      tempFiles.push(compressedPath)
      await this.unlinkFn(dumpPath)

      const encryptedPath = await this.snapshotHelper.encrypt(compressedPath)
      tempFiles.push(encryptedPath)

      const fileStats = await this.statFn(encryptedPath)
      const size = fileStats.size

      const manifestPath = await this.createManifest(modifiedTables, lastFullBackup.filename)
      tempFiles.push(manifestPath)

      await this.uploader.upload(encryptedPath, this.context.filename)

      const duration = Date.now() - startTime

      this.logService.info({
        message: 'Backup completed successfully',
        category: LogCategory.SYSTEM,
        metadata: { filename: this.context.filename, size, duration },
      })

      return {
        success: true,
        filename: this.context.filename,
        type: 'differential',
        size,
        duration,
        storage: backupConfig.storage.disk,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      this.logService.error({
        message: 'Differential backup failed',
        category: LogCategory.SYSTEM,
        error,
        context: { filename: this.context.filename, duration },
      })

      return {
        success: false,
        filename: this.context.filename,
        type: 'differential',
        size: 0,
        duration,
        storage: backupConfig.storage.disk,
        error: error.message,
      }
    } finally {
      await this.cleanupTemp(...tempFiles)
    }
  }

  private async createManifest(tables: string[], fullBackupReference: string): Promise<string> {
    const manifestFilename = SnapshotHelper.manifestFilename(this.context.filename)
    const manifestPath = join(this.context.tempDir, manifestFilename)
    await this.writeFileFn(
      manifestPath,
      JSON.stringify({ type: 'differential', tables, fullBackupReference }, null, 2)
    )
    await this.uploader.upload(manifestPath, manifestFilename)
    return manifestPath
  }

  /**
   * Clean up temporary files left in the local temp directory.
   * Silently ignores missing files — called after success or failure.
   */
  private async cleanupTemp(...paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        await this.unlinkFn(path)
      } catch {
        // File already gone — no-op
      }
    }
  }

  private async findLastFullBackup(): Promise<BackupMetadata | null> {
    const backups = await this.listBackups()
    const fullBackups = backups.filter((b) => b.type === 'full')
    return fullBackups.length > 0 ? fullBackups[0] : null
  }

  private async listBackups(): Promise<BackupMetadata[]> {
    try {
      const objects = await this.uploader.listBackups()
      const backups: BackupMetadata[] = []

      for (const object of objects) {
        if (object.isDirectory) continue

        const filename = object.key.replace(backupConfig.storage.prefix + '/', '')
        const match = filename.match(/backup-(full|differential)-(\d{4}-\d{2}-\d{2})-(\d{6})/)
        if (!match) continue

        const meta = await this.uploader.getMetaData(object.key)

        backups.push({
          filename,
          type: match[1] as 'full' | 'differential',
          size: meta.contentLength || 0,
          createdAt: meta.lastModified || this.parseFilenameDate(match[2], match[3]),
          path: object.key,
        })
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      this.logService.error({
        message: 'Failed to list backups from Drive',
        category: LogCategory.SYSTEM,
        error,
        context: { disk: backupConfig.storage.disk },
      })
      return []
    }
  }

  private parseFilenameDate(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number)
    const hour = Number.parseInt(time.slice(0, 2))
    const minute = Number.parseInt(time.slice(2, 4))
    const second = Number.parseInt(time.slice(4, 6))
    return new Date(year, month - 1, day, hour, minute, second)
  }

  private async getModifiedTables(since: Date): Promise<string[]> {
    const db = await import('@adonisjs/lucid/services/db')
    const connection = db.default.connection(backupConfig.database.connection)

    const result = await connection.rawQuery(
      `
        SELECT
          schemaname || '.' || relname as table_name,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE
          schemaname = 'public'
          AND (
            last_vacuum > ? OR
            last_autovacuum > ? OR
            last_analyze > ? OR
            last_autoanalyze > ?
          )
        ORDER BY relname
      `,
      [since, since, since, since]
    )

    const modifiedFromStats = result.rows.map((row: any) => row.table_name.replace('public.', ''))

    const allTablesResult = await connection.rawQuery(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    )
    const allTables = allTablesResult.rows.map((row: any) => row.tablename)

    const modifiedFromUpdatedAt: string[] = []

    for (const table of allTables) {
      if (backupConfig.differential.excludedTables.includes(table)) continue

      try {
        const hasUpdatedAt = await connection.rawQuery(
          `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = ?
              AND column_name = 'updated_at'
          `,
          [table]
        )

        if (hasUpdatedAt.rows.length > 0) {
          const hasModified = await connection.rawQuery(
            `SELECT 1 FROM "${table}" WHERE updated_at > ? LIMIT 1`,
            [since]
          )
          if (hasModified.rows.length > 0) {
            modifiedFromUpdatedAt.push(table)
          }
        }
      } catch (error) {
        this.logService.warn({
          message: 'Failed to check table for modifications',
          category: LogCategory.SYSTEM,
          error,
          metadata: { table },
        })
      }
    }

    return [...new Set([...modifiedFromStats, ...modifiedFromUpdatedAt])]
  }
}
