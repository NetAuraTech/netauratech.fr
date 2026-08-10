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
import type { BackupResult, BackupContext } from '#services/backup/backup_strategy'

/**
 * FullBackupStrategy — Executes a full database backup.
 *
 * Pipeline: pg_dump (all tables) → compress → encrypt → upload → manifest.
 *
 * **Dependency injection for testability**
 *
 * The optional `opts` bag accepts dependencies prefixed with `_` to distinguish
 * them from public API parameters. In production, `opts` is never passed and each
 * dependency falls back to its real implementation (e.g. `mkdir as defaultMkdir`).
 * In tests, stubs replace the real functions so no ESM-level mocking is needed.
 *
 * @example Production usage
 *   new FullBackupStrategy(context, logService)
 *
 * @example Test usage
 *   new FullBackupStrategy(context, logService, {
 *     _snapshotHelper: snapshotMock,
 *     _mkdir: mkdirStub,
 *   })
 */
export class FullBackupStrategy {
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
      message: 'Starting full backup',
      category: LogCategory.SYSTEM,
      metadata: { filename: this.context.filename },
    })

    // Track all temp paths for cleanup
    const tempFiles: string[] = []

    try {
      await this.mkdirFn(this.context.tempDir, { recursive: true })

      const dumpPath = tempPath.replace(/\.(gz\.enc|enc|gz)$/, '.sql')
      tempFiles.push(dumpPath)
      await this.createDump({
        host: env.get('PG_HOST')!,
        port: Number(env.get('PG_PORT') || 5432),
        user: env.get('PG_USER')!,
        database: env.get('PG_DB_NAME')!,
        password: env.get('PG_PASSWORD').release(),
        outputPath: dumpPath,
      })

      const compressedPath = await this.snapshotHelper.compress(dumpPath)
      tempFiles.push(compressedPath)
      await this.unlinkFn(dumpPath)

      const encryptedPath = await this.snapshotHelper.encrypt(compressedPath)
      tempFiles.push(encryptedPath)

      const fileStats = await this.statFn(encryptedPath)
      const size = fileStats.size

      await this.uploader.upload(encryptedPath, this.context.filename)

      const tables = await this.getAllTables()
      const manifestPath = await this.createManifest(tables)
      tempFiles.push(manifestPath)

      const duration = Date.now() - startTime

      this.logService.info({
        message: 'Backup completed successfully',
        category: LogCategory.SYSTEM,
        metadata: { filename: this.context.filename, size, duration },
      })

      return {
        success: true,
        filename: this.context.filename,
        type: 'full',
        size,
        duration,
        storage: backupConfig.storage.disk,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      this.logService.error({
        message: 'Full backup failed',
        category: LogCategory.SYSTEM,
        error,
        context: { filename: this.context.filename, duration },
      })

      return {
        success: false,
        filename: this.context.filename,
        type: 'full',
        size: 0,
        duration,
        storage: backupConfig.storage.disk,
        error: error.message,
      }
    } finally {
      await this.cleanupTemp(...tempFiles)
    }
  }

  private async createManifest(tables: string[]): Promise<string> {
    const manifestFilename = SnapshotHelper.manifestFilename(this.context.filename)
    const manifestPath = join(this.context.tempDir, manifestFilename)
    await this.writeFileFn(manifestPath, JSON.stringify({ tables }, null, 2))
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

  private async getAllTables(): Promise<string[]> {
    const db = await import('@adonisjs/lucid/services/db')
    const connection = db.default.connection(backupConfig.database.connection)
    const result = await connection.rawQuery(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    )
    return result.rows.map((row: any) => row.tablename)
  }
}
