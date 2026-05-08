import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import drive from '@adonisjs/drive/services/main'
import backupConfig from '#config/backup'
import { spawn, type ChildProcess } from 'node:child_process'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, stat, unlink, writeFile, readFile, statfs } from 'node:fs/promises'
import { join } from 'node:path'
import { createGunzip, createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { DateTime } from 'luxon'
import env from '#start/env'
import { LogService } from '#services/logging/log_service'
import { LogCategory } from '#types/logging'
import { createEncryptionHelper } from '#helpers/core/encryption'
import app from '@adonisjs/core/services/app'

/**
 * Metadata describing a backup file, as stored or returned by the backup service.
 *
 * The `path` field contains the full Drive key (e.g. `backup/backup-full-2024-01-15-120000.sql.gz.enc`).
 */
export interface BackupMetadata {
  /** Original filename of the backup archive (e.g. `backup-2024-01-15.zip`). */
  filename: string

  /**
   * Backup strategy used to produce this file.
   * - `full` — complete snapshot of the database.
   * - `differential` — only the changes since the last full backup.
   */
  type: 'full' | 'differential'

  /** File size in bytes. */
  size: number

  /** Date and time at which the backup was created. */
  createdAt: Date

  /** Full Drive key path to the backup file. */
  path: string
}

/**
 * Result returned by a backup operation.
 */
export interface BackupResult {
  /** Whether the backup completed without errors. */
  success: boolean

  /** Generated filename of the backup archive. */
  filename: string

  /** Backup strategy used for this run. */
  type: 'full' | 'differential'

  /** Final size of the backup archive in bytes. `0` on failure. */
  size: number

  /** Total duration of the backup operation in milliseconds. */
  duration: number

  /** Drive disk used for storage (e.g. `'fs'`, `'s3'`, `'r2'`). */
  storage: string

  /** Human-readable error message. Present only when `success` is `false`. */
  error?: string
}

/**
 * Manifest file written alongside each backup archive.
 *
 * Stored as a `.manifest.json` file on Drive so that the backup system can
 * reconstruct what was backed up and when, without inspecting the archive itself.
 */
export interface BackupManifest {
  /** Backup strategy used to produce this archive. */
  type: 'full' | 'differential'

  /** ISO 8601 timestamp of when the backup was created. */
  createdAt: string

  /**
   * List of database table names included in this backup.
   * For full backups: all tables. For differential: only modified tables.
   */
  tables: string[]

  /**
   * Filename of the full backup this differential is based on.
   * Present only for `differential` backups.
   */
  fullBackupReference?: string
}

/**
 * Orchestrates the full backup lifecycle: dump, compress, encrypt, upload,
 * cleanup, restoration, health checks, and retention policy enforcement.
 *
 * Storage is handled by `@adonisjs/drive` — the same package used for CMS
 * file uploads. All backup files are stored under the `backup/` prefix on
 * the configured Drive disk (`fs`, `s3`, or `r2`).
 *
 * Two backup strategies are available:
 * - **Full** — complete `pg_dump` of the entire database.
 * - **Differential** — `pg_dump` scoped to tables modified since the last
 *   full backup, detected via `pg_stat_user_tables` and `updated_at` columns.
 *
 * The {@link run} method auto-selects the strategy based on the configured
 * `fullBackupDay` weekday. If no full backup exists when a differential is
 * requested, a full backup is performed automatically.
 *
 * @example
 * const result = await backupService.run()
 * if (!result.success) {
 *   console.error(result.error)
 * }
 */
@inject()
export default class BackupService {
  private encryptionHelper = createEncryptionHelper(backupConfig.encryption.key.release())
  private tempDir = 'storage/temp/backups'

  constructor(protected logService: LogService) {}

  /**
   * Returns the configured Drive disk for backups.
   */
  private getDisk() {
    return drive.use(backupConfig.storage.disk as Parameters<typeof drive.use>[0])
  }

  /**
   * Builds the full storage path for a backup file.
   */
  private buildPath(filename: string): string {
    return `${backupConfig.storage.prefix}/${filename}`
  }

  /**
   * Runs a backup using the strategy appropriate for the current day.
   *
   * Performs a **full** backup when today matches the configured
   * `fullBackupDay` weekday; a **differential** backup on all other days.
   *
   * @returns The {@link BackupResult} from the selected strategy.
   *
   * @example
   * const result = await backupService.run()
   */
  async run(): Promise<BackupResult> {
    const today = DateTime.now()
    const isFullBackupDay = today.weekday === backupConfig.schedule.fullBackupDay
    return isFullBackupDay ? this.runFullBackup() : this.runDifferentialBackup()
  }

  /**
   * Runs a full database backup.
   *
   * Pipeline:
   * 1. `pg_dump` → plain SQL file
   * 2. gzip compression
   * 3. AES-256-CBC encryption (if enabled)
   * 4. Upload to Drive
   * 5. Manifest file written and uploaded
   * 6. Temp files cleaned up
   *
   * If the resulting archive exceeds `backupConfig.health.maxBackupSize`,
   * an admin notification is triggered. A success notification is sent
   * when `backupConfig.notifications.onSuccess` is enabled.
   *
   * @returns A {@link BackupResult} describing the outcome.
   *
   * @example
   * const result = await backupService.runFullBackup()
   */
  async runFullBackup(): Promise<BackupResult> {
    const startTime = Date.now()
    const filename = this.generateFilename('full')
    const tempPath = join(this.tempDir, filename)

    this.logService.info({
      message: 'Starting full backup',
      category: LogCategory.SYSTEM,
      metadata: { filename },
    })

    try {
      await mkdir(this.tempDir, { recursive: true })

      const dumpPath = tempPath.replace(/\.(gz\.enc|enc|gz)$/, '.sql')
      await this.createDatabaseDump(dumpPath)

      const compressedPath = await this.compressFile(dumpPath)
      await unlink(dumpPath)

      const encryptedPath = await this.encryptFile(compressedPath)

      const fileStats = await stat(encryptedPath)
      const size = fileStats.size

      const tables = await this.getAllTables()
      await this.createManifest(filename, {
        type: 'full',
        createdAt: new Date().toISOString(),
        tables,
      })

      await this.uploadToDrive(encryptedPath, filename)
      await unlink(encryptedPath)

      const duration = Date.now() - startTime

      this.logService.logPerformance('backup.full', duration, { filename, size })

      if (size > backupConfig.health.maxBackupSize * 1024 * 1024) {
        await this.notifyLargeBackup(filename, size)
      }

      if (backupConfig.notifications.onSuccess) {
        await this.notifySuccess(filename, size, duration)
      }

      return {
        success: true,
        filename,
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
        context: { filename, duration },
      })

      await this.notifyFailure(filename, error)

      return {
        success: false,
        filename,
        type: 'full',
        size: 0,
        duration,
        storage: backupConfig.storage.disk,
        error: error.message,
      }
    }
  }

  /**
   * Runs a differential backup containing only tables modified since the last
   * full backup.
   *
   * If no full backup exists, falls back to {@link runFullBackup} automatically.
   * If no tables have been modified, returns a successful no-op result with an
   * empty filename and zero size.
   *
   * Pipeline:
   * 1. Locate last full backup via Drive listing
   * 2. Detect modified tables (`pg_stat_user_tables` + `updated_at` scan)
   * 3. `pg_dump -t` scoped to modified tables → plain SQL file
   * 4. gzip compression
   * 5. AES-256-CBC encryption (if enabled)
   * 6. Upload to Drive
   * 7. Manifest file written and uploaded
   * 8. Temp files cleaned up
   *
   * @returns A {@link BackupResult} describing the outcome.
   *
   * @example
   * const result = await backupService.runDifferentialBackup()
   */
  async runDifferentialBackup(): Promise<BackupResult> {
    const startTime = Date.now()
    const filename = this.generateFilename('differential')
    const tempPath = join(this.tempDir, filename)

    this.logService.info({
      message: 'Starting differential backup',
      category: LogCategory.SYSTEM,
      metadata: { filename },
    })

    try {
      await mkdir(this.tempDir, { recursive: true })

      const lastFullBackup = await this.findLastFullBackup()
      if (!lastFullBackup) {
        this.logService.warn({
          message: 'No full backup found, running full backup instead',
          category: LogCategory.SYSTEM,
        })
        return this.runFullBackup()
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
      await this.createDifferentialDump(dumpPath, modifiedTables)

      const compressedPath = await this.compressFile(dumpPath)
      await unlink(dumpPath)

      const encryptedPath = await this.encryptFile(compressedPath)

      const fileStats = await stat(encryptedPath)
      const size = fileStats.size

      await this.createManifest(filename, {
        type: 'differential',
        createdAt: new Date().toISOString(),
        tables: modifiedTables,
        fullBackupReference: lastFullBackup.filename,
      })

      await this.uploadToDrive(encryptedPath, filename)
      await unlink(encryptedPath)

      const duration = Date.now() - startTime

      this.logService.logPerformance('backup.differential', duration, {
        filename,
        size,
        tablesCount: modifiedTables.length,
      })

      return {
        success: true,
        filename,
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
        context: { filename, duration },
      })

      await this.notifyFailure(filename, error)

      return {
        success: false,
        filename,
        type: 'differential',
        size: 0,
        duration,
        storage: backupConfig.storage.disk,
        error: error.message,
      }
    }
  }

  /**
   * Spawns `pg_dump` to produce a plain-text SQL dump of the entire database.
   *
   * The dump is written directly to `outputPath`. The `PGPASSWORD` environment
   * variable is injected at process level to avoid passing the password as a
   * CLI argument.
   *
   * @param outputPath - Absolute path where the `.sql` dump file will be written.
   * @throws If `pg_dump` exits with a non-zero code or fails to start.
   */
  private async createDatabaseDump(outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-h',
        env.get('PG_HOST')!,
        '-p',
        String(env.get('PG_PORT') || 5432),
        '-U',
        env.get('PG_USER')!,
        '-d',
        env.get('PG_DB_NAME')!,
        '-F',
        'p',
        '-f',
        outputPath,
      ]

      const pgDump: ChildProcess = spawn('pg_dump', args, {
        env: { ...process.env, PGPASSWORD: env.get('PG_PASSWORD').release() },
      })

      let errorOutput = ''
      pgDump.stderr!.on('data', (data) => {
        errorOutput += data.toString()
      })
      pgDump.on('close', (code) => {
        code === 0
          ? resolve()
          : reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`))
      })
      pgDump.on('error', (error) => {
        reject(new Error(`Failed to start pg_dump: ${error.message}`))
      })
    })
  }

  /**
   * Spawns `pg_dump` scoped to a specific set of tables to produce a
   * plain-text SQL differential dump.
   *
   * Each table in `tables` is passed as a `-t` argument. The `PGPASSWORD`
   * environment variable is injected at process level.
   *
   * @param outputPath - Absolute path where the `.sql` dump file will be written.
   * @param tables - List of table names to include in the dump.
   * @throws If `pg_dump` exits with a non-zero code or fails to start.
   */
  private async createDifferentialDump(outputPath: string, tables: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-h',
        env.get('PG_HOST')!,
        '-p',
        String(env.get('PG_PORT') || 5432),
        '-U',
        env.get('PG_USER')!,
        '-d',
        env.get('PG_DB_NAME')!,
        '-F',
        'p',
        '-f',
        outputPath,
      ]

      for (const table of tables) {
        args.push('-t', table)
      }

      const pgDump: ChildProcess = spawn('pg_dump', args, {
        env: { ...process.env, PGPASSWORD: env.get('PG_PASSWORD').release() },
      })

      let errorOutput = ''
      pgDump.stderr!.on('data', (data) => {
        errorOutput += data.toString()
      })
      pgDump.on('close', (code) => {
        code === 0
          ? resolve()
          : reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`))
      })
      pgDump.on('error', (error) => {
        reject(new Error(`Failed to start pg_dump: ${error.message}`))
      })
    })
  }

  /**
   * Compresses a file using gzip and writes the result to `<inputPath>.gz`.
   *
   * The compression level is read from `backupConfig.compression.level`.
   * The original file is not deleted — callers are responsible for cleanup.
   *
   * @param inputPath - Absolute path to the file to compress.
   * @returns The path to the compressed `.gz` file.
   */
  private async compressFile(inputPath: string): Promise<string> {
    const outputPath = `${inputPath}.gz`
    const input = createReadStream(inputPath)
    const output = createWriteStream(outputPath)
    const gzip = createGzip({ level: backupConfig.compression.level })
    await pipeline(input, gzip, output)
    return outputPath
  }

  /**
   * Decompresses a gzip file and writes the plaintext to `outputPath`.
   *
   * The compressed file is not deleted — callers are responsible for cleanup.
   *
   * @param inputPath - Absolute path to the `.gz` file to decompress.
   * @param outputPath - Absolute path where the decompressed file will be written.
   */
  private async decompressFile(inputPath: string, outputPath: string): Promise<void> {
    const input = createReadStream(inputPath)
    const output = createWriteStream(outputPath)
    const gunzip = createGunzip()
    await pipeline(input, gunzip, output)
  }

  /**
   * Encrypts a file using the configured {@link EncryptionHelper} and writes
   * the result to `<inputPath>.enc`.
   *
   * If encryption is disabled in `backupConfig`, the input path is returned
   * unchanged and no file is created. Otherwise, the original unencrypted file
   * is deleted after encryption.
   *
   * @param inputPath - Absolute path to the file to encrypt.
   * @returns The path to the encrypted `.enc` file, or `inputPath` if
   *   encryption is disabled.
   */
  private async encryptFile(inputPath: string): Promise<string> {
    if (!backupConfig.encryption.enabled) return inputPath
    const outputPath = `${inputPath}.enc`
    await this.encryptionHelper.encryptFile(inputPath, outputPath)
    await unlink(inputPath)
    return outputPath
  }

  /**
   * Decrypts a file using the configured {@link EncryptionHelper} and writes
   * the plaintext to `outputPath`.
   *
   * If encryption is disabled in `backupConfig`, this method is a no-op.
   *
   * @param inputPath - Absolute path to the encrypted `.enc` file.
   * @param outputPath - Absolute path where the decrypted file will be written.
   */
  private async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    if (!backupConfig.encryption.enabled) return
    await this.encryptionHelper.decryptFile(inputPath, outputPath)
  }

  /**
   * Uploads a local backup file to the configured Drive disk.
   *
   * The file contents are read into memory and written to Drive under the
   * `backup/` prefix. Logs the upload via `logBusiness`.
   *
   * @param localPath - Absolute path to the backup archive to upload.
   * @param filename - Destination filename used as the Drive key.
   * @throws If the underlying Drive adapter fails to write the file.
   */
  private async uploadToDrive(localPath: string, filename: string): Promise<void> {
    const disk = this.getDisk()
    const remotePath = this.buildPath(filename)
    const contents = await readFile(localPath)

    await disk.put(remotePath, contents, {
      contentType: 'application/octet-stream',
    })

    this.logService.logBusiness('backup.uploaded', {
      disk: backupConfig.storage.disk,
      path: remotePath,
    })
  }

  /**
   * Downloads a backup file from Drive and streams it to a local path.
   *
   * The destination directory is created recursively if it does not exist.
   * The response body is piped directly to disk to avoid buffering the
   * entire archive in memory.
   *
   * @param filename - Filename of the backup within the `backup/` prefix.
   * @param localPath - Absolute local path where the file should be written.
   * @throws If the file cannot be retrieved from Drive.
   */
  private async downloadFromDrive(filename: string, localPath: string): Promise<void> {
    const disk = this.getDisk()
    const remotePath = this.buildPath(filename)
    const stream = await disk.getStream(remotePath)

    await mkdir(join(localPath, '..'), { recursive: true })
    const writeStream = createWriteStream(localPath)
    await pipeline(stream as any, writeStream)
  }

  /**
   * Generates a timestamped backup filename based on the strategy type.
   *
   * The filename follows the pattern:
   * `backup-{type}-{YYYY-MM-DD}-{HHmmss}.sql[.gz][.enc]`
   *
   * The `.gz` and `.enc` suffixes are appended when compression and
   * encryption are enabled in `backupConfig`, respectively.
   *
   * @param type - Backup strategy (`'full'` or `'differential'`).
   * @returns The generated filename string.
   *
   * @example
   * this.generateFilename('full') // 'backup-full-2024-01-15-143022.sql.gz.enc'
   */
  private generateFilename(type: 'full' | 'differential'): string {
    const now = DateTime.now()
    const date = now.toFormat('yyyy-MM-dd')
    const time = now.toFormat('HHmmss')

    let filename = `backup-${type}-${date}-${time}.sql`

    if (backupConfig.compression.enabled) filename += '.gz'
    if (backupConfig.encryption.enabled) filename += '.enc'

    return filename
  }

  /**
   * Writes a JSON manifest file for a backup and uploads it to Drive.
   *
   * The manifest filename is derived from the backup filename by stripping
   * the archive extensions and appending `.manifest.json`. The local temp
   * file is deleted after all uploads complete.
   *
   * Manifest upload failures are logged but do not abort the backup.
   *
   * @param filename - The backup archive filename the manifest corresponds to.
   * @param data - The {@link BackupManifest} data to serialize.
   */
  private async createManifest(filename: string, data: BackupManifest): Promise<void> {
    const manifestFilename = filename.replace(/\.(sql|gz|enc)+$/, '.manifest.json')
    const manifestPath = join(this.tempDir, manifestFilename)

    await writeFile(manifestPath, JSON.stringify(data, null, 2))

    try {
      await this.uploadToDrive(manifestPath, manifestFilename)
    } catch (error) {
      this.logService.error({
        message: 'Failed to upload manifest',
        category: LogCategory.SYSTEM,
        error,
      })
    }

    await unlink(manifestPath)
  }

  /**
   * Queries PostgreSQL for the names of all tables in the `public` schema,
   * sorted alphabetically.
   *
   * @returns An array of table name strings.
   */
  private async getAllTables(): Promise<string[]> {
    const connection = db.connection(backupConfig.database.connection)
    const result = await connection.rawQuery(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    )
    return result.rows.map((row: any) => row.tablename)
  }

  /**
   * Identifies tables modified since a given date using two complementary strategies:
   *
   * 1. **`pg_stat_user_tables`** — checks `last_vacuum`, `last_autovacuum`,
   *    `last_analyze`, and `last_autoanalyze` timestamps.
   * 2. **`updated_at` column scan** — for each table that has an `updated_at`
   *    column, queries directly for rows newer than `since`.
   *
   * Tables listed in `backupConfig.differential.excludedTables` are skipped.
   * Results from both strategies are deduplicated before being returned.
   *
   * @param since - Only tables with activity after this date are returned.
   * @returns A deduplicated array of modified table names.
   */
  private async getModifiedTables(since: Date): Promise<string[]> {
    const connection = db.connection(backupConfig.database.connection)

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

    const allTables = await this.getAllTables()
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

  /**
   * Finds the most recent full backup by listing files on Drive.
   *
   * Returns `null` if no full backups exist yet.
   *
   * @returns The {@link BackupMetadata} of the latest full backup, or `null`.
   */
  private async findLastFullBackup(): Promise<BackupMetadata | null> {
    const backups = await this.listBackups()
    const fullBackups = backups.filter((b) => b.type === 'full')
    return fullBackups.length > 0 ? fullBackups[0] : null
  }

  /**
   * Lists all backups stored on Drive, sorted by date (most recent first).
   *
   * Only files whose names match the pattern
   * `backup-(full|differential)-YYYY-MM-DD-HHmmss` are included.
   * Results are sorted by `createdAt` in descending order.
   *
   * @returns An array of {@link BackupMetadata} objects. Returns an empty array
   *   if the listing fails or contains no matching files.
   *
   * @example
   * const backups = await backupService.listBackups()
   * console.log(backups[0].filename) // most recent backup
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const disk = this.getDisk()
      const prefix = `${backupConfig.storage.prefix}/`
      const { objects } = await disk.listAll(prefix)
      const backups: BackupMetadata[] = []

      for (const object of objects) {
        if (object.isDirectory) continue

        const filename = object.key.replace(prefix, '')
        const match = filename.match(/backup-(full|differential)-(\d{4}-\d{2}-\d{2})-(\d{6})/)
        if (!match) continue

        const meta = await disk.getMetaData(object.key)

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

  /**
   * Deletes backup files from Drive that fall outside the configured
   * retention windows.
   *
   * Retention policy applied (from `backupConfig.retention`):
   * - **Daily** — keep all backups newer than `daily` days.
   * - **Weekly** — keep one backup per week (Sunday) for up to `weekly` weeks.
   * - **Monthly** — keep one backup per month (1st) for up to `monthly` months.
   * - **Yearly** — keep one backup per year (Jan 1st) for up to `yearly` years.
   *
   * Deletion errors are counted and logged but do not abort the cleanup.
   *
   * @returns A summary with the count of `deleted`, `kept`, and `errors`.
   *
   * @example
   * const { deleted, kept, errors } = await backupService.cleanup()
   */
  async cleanup(): Promise<{ deleted: number; kept: number; errors: number }> {
    this.logService.info({
      message: 'Starting backup cleanup',
      category: LogCategory.SYSTEM,
    })

    let deleted = 0
    let kept = 0
    let errors = 0

    try {
      const disk = this.getDisk()
      const backups = await this.listBackups()
      const toDelete = this.getBackupsToDelete(backups)

      for (const backup of toDelete) {
        try {
          await disk.delete(this.buildPath(backup.filename))
          deleted++
          this.logService.debug({
            message: 'Backup deleted',
            category: LogCategory.SYSTEM,
            metadata: { filename: backup.filename },
          })
        } catch (error) {
          errors++
          this.logService.error({
            message: 'Failed to delete backup',
            category: LogCategory.SYSTEM,
            error,
            metadata: { filename: backup.filename },
          })
        }
      }

      kept = backups.length - toDelete.length
    } catch (error) {
      this.logService.error({
        message: 'Failed to cleanup backups',
        category: LogCategory.SYSTEM,
        error,
      })
    }

    this.logService.info({
      message: 'Backup cleanup completed',
      category: LogCategory.SYSTEM,
      metadata: { deleted, kept, errors },
    })

    return { deleted, kept, errors }
  }

  /**
   * Applies the retention policy to a list of backups and returns those that
   * should be deleted.
   *
   * A backup is kept if it falls within any of the daily, weekly, monthly, or
   * yearly retention windows. All others are candidates for deletion.
   *
   * @param backups - The full list of {@link BackupMetadata} to evaluate.
   * @returns The subset of backups that are outside all retention windows.
   */
  private getBackupsToDelete(backups: BackupMetadata[]): BackupMetadata[] {
    const now = DateTime.now()
    const toKeep = new Set<string>()

    const sorted = [...backups].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const dailyBackups = sorted.filter(
      (b) => DateTime.fromJSDate(b.createdAt) > now.minus({ days: backupConfig.retention.daily })
    )
    dailyBackups.forEach((b) => toKeep.add(b.filename))

    const weeklyBackups = sorted
      .filter((b) => {
        const date = DateTime.fromJSDate(b.createdAt)
        return date.weekday === 7 && date > now.minus({ weeks: backupConfig.retention.weekly })
      })
      .slice(0, backupConfig.retention.weekly)
    weeklyBackups.forEach((b) => toKeep.add(b.filename))

    const monthlyBackups = sorted
      .filter((b) => {
        const date = DateTime.fromJSDate(b.createdAt)
        return date.day === 1 && date > now.minus({ months: backupConfig.retention.monthly })
      })
      .slice(0, backupConfig.retention.monthly)
    monthlyBackups.forEach((b) => toKeep.add(b.filename))

    const yearlyBackups = sorted
      .filter((b) => {
        const date = DateTime.fromJSDate(b.createdAt)
        return (
          date.month === 1 &&
          date.day === 1 &&
          date > now.minus({ years: backupConfig.retention.yearly })
        )
      })
      .slice(0, backupConfig.retention.yearly)
    yearlyBackups.forEach((b) => toKeep.add(b.filename))

    return sorted.filter((b) => !toKeep.has(b.filename))
  }

  /**
   * Performs a health check on the backup system.
   *
   * Checks performed:
   * - The configured Drive disk is pinged via `listAll()`.
   * - Free disk space on local storage (when disk is `fs`) is compared against
   *   `backupConfig.health.minFreeSpace` (in GB).
   * - The age of the most recent backup is compared against
   *   `backupConfig.health.maxBackupAge` (in hours).
   *
   * If any issues are found and `backupConfig.notifications.onHealthCheckFailure`
   * is enabled, an admin notification is triggered.
   *
   * @returns An object with `healthy` flag, `issues` array, `lastBackup`
   *   metadata, and storage availability status.
   *
   * @example
   * const { healthy, issues } = await backupService.healthCheck()
   */
  async healthCheck(): Promise<{
    healthy: boolean
    issues: string[]
    lastBackup: BackupMetadata | null
    storage: { disk: string; available: boolean }
  }> {
    const issues: string[] = []
    let available = false

    try {
      const disk = this.getDisk()
      // Check availability by listing the prefix
      await disk.listAll(`${backupConfig.storage.prefix}/`)
      available = true
    } catch {
      issues.push(`Storage disk "${backupConfig.storage.disk}" is not available`)
    }

    // Check free space for local disk
    if (backupConfig.storage.disk === 'fs' && available) {
      try {
        const storagePath = app.makePath('storage')
        const stats = await statfs(storagePath)
        const freeSpaceGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024)
        if (freeSpaceGB < backupConfig.health.minFreeSpace) {
          issues.push(
            `Low disk space: ${freeSpaceGB.toFixed(2)}GB (minimum: ${backupConfig.health.minFreeSpace}GB)`
          )
        }
      } catch {
        // Cannot determine free space — non-fatal
      }
    }

    const backups = await this.listBackups()
    let lastBackup: BackupMetadata | null = null

    if (backups.length > 0) {
      lastBackup = backups[0]

      const hoursSinceLastBackup = (Date.now() - lastBackup.createdAt.getTime()) / (1000 * 60 * 60)

      if (hoursSinceLastBackup > backupConfig.health.maxBackupAge) {
        issues.push(
          `Last backup is too old: ${hoursSinceLastBackup.toFixed(1)} hours (max: ${backupConfig.health.maxBackupAge} hours)`
        )
      }
    } else {
      issues.push('No backups found')
    }

    const healthy = issues.length === 0

    if (!healthy && backupConfig.notifications.onHealthCheckFailure) {
      await this.notifyHealthCheckFailure(issues)
    }

    return {
      healthy,
      issues,
      lastBackup,
      storage: { disk: backupConfig.storage.disk, available },
    }
  }

  /**
   * Restores a database from a backup archive stored on Drive.
   *
   * Pipeline:
   * 1. Download archive from Drive to temp directory
   * 2. Decrypt (if encryption is enabled)
   * 3. Decompress (if compression is enabled)
   * 4. Restore via `psql`
   * 5. Temp files cleaned up
   *
   * @param filename - The filename of the backup archive to restore.
   * @returns An object with `success` flag and optional `error` message.
   *
   * @example
   * const { success, error } = await backupService.restore('backup-full-2024-01-15-120000.sql.gz.enc')
   */
  async restore(filename: string): Promise<{ success: boolean; error?: string }> {
    this.logService.info({
      message: 'Starting backup restoration',
      category: LogCategory.SYSTEM,
      metadata: { filename },
    })

    try {
      const disk = this.getDisk()
      const remotePath = this.buildPath(filename)
      const exists = await disk.exists(remotePath)

      if (!exists) {
        throw new Error(`Backup file not found: ${filename}`)
      }

      const tempPath = join(this.tempDir, filename)
      await mkdir(this.tempDir, { recursive: true })

      await this.downloadFromDrive(filename, tempPath)

      const decryptedPath = tempPath.replace(/\.enc$/, '')

      if (backupConfig.encryption.enabled) {
        await this.decryptFile(tempPath, decryptedPath)
        await unlink(tempPath)
      }

      const decompressedPath = decryptedPath.replace(/\.gz$/, '')
      if (backupConfig.compression.enabled) {
        await this.decompressFile(decryptedPath, decompressedPath)
        await unlink(decryptedPath)
      }

      await this.restoreDatabase(decompressedPath)
      await unlink(decompressedPath)

      this.logService.info({
        message: 'Backup restoration completed',
        category: LogCategory.SYSTEM,
        metadata: { filename },
      })

      return { success: true }
    } catch (error) {
      this.logService.error({
        message: 'Backup restoration failed',
        category: LogCategory.SYSTEM,
        error,
        metadata: { filename },
      })

      return { success: false, error: error.message }
    }
  }

  /**
   * Spawns `psql` to execute a plain SQL dump file against the configured database.
   *
   * The `PGPASSWORD` environment variable is injected at process level.
   *
   * @param sqlPath - Absolute path to the `.sql` file to execute.
   * @throws If `psql` exits with a non-zero code or fails to start.
   */
  private async restoreDatabase(sqlPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-h',
        env.get('PG_HOST')!,
        '-p',
        String(env.get('PG_PORT') || 5432),
        '-U',
        env.get('PG_USER')!,
        '-d',
        env.get('PG_DB_NAME')!,
        '-f',
        sqlPath,
      ]

      const psql: ChildProcess = spawn('psql', args, {
        env: { ...process.env, PGPASSWORD: env.get('PG_PASSWORD').release() },
      })

      let errorOutput = ''
      psql.stderr!.on('data', (data) => {
        errorOutput += data.toString()
      })
      psql.on('close', (code) => {
        code === 0 ? resolve() : reject(new Error(`psql failed with code ${code}: ${errorOutput}`))
      })
      psql.on('error', (error) => {
        reject(new Error(`Failed to start psql: ${error.message}`))
      })
    })
  }

  /**
   * Reconstructs a `Date` object from the date and time fragments extracted
   * from a backup filename.
   *
   * @param date - Date segment in `YYYY-MM-DD` format.
   * @param time - Time segment as a 6-digit string `HHmmss` (e.g. `143022`).
   * @returns The corresponding `Date` in local time.
   *
   * @example
   * this.parseFilenameDate('2024-01-15', '143022') // 2024-01-15 14:30:22
   */
  private parseFilenameDate(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number)
    const hour = Number.parseInt(time.slice(0, 2))
    const minute = Number.parseInt(time.slice(2, 4))
    const second = Number.parseInt(time.slice(4, 6))
    return new Date(year, month - 1, day, hour, minute, second)
  }

  /**
   * Logs a successful backup event.
   * Triggered when `backupConfig.notifications.onSuccess` is enabled.
   *
   * @param filename - The backup archive filename.
   * @param size - The archive size in bytes.
   * @param duration - The backup duration in milliseconds.
   *
   * @todo Send email or in-app notification to admin.
   */
  private async notifySuccess(filename: string, size: number, duration: number): Promise<void> {
    this.logService.info({
      message: 'Backup completed successfully',
      category: LogCategory.SYSTEM,
      metadata: { filename, size, duration },
    })
  }

  /**
   * Logs a backup failure event.
   * Triggered when `backupConfig.notifications.onFailure` is enabled.
   *
   * @param filename - The backup archive filename that failed.
   * @param error - The error that caused the failure.
   *
   * @todo Send email or in-app notification to admin.
   */
  private async notifyFailure(filename: string, error: Error): Promise<void> {
    if (!backupConfig.notifications.onFailure) return
    this.logService.error({
      message: 'Sending backup failure notification',
      category: LogCategory.SYSTEM,
      error,
      metadata: { filename },
    })
  }

  /**
   * Logs a warning when a backup archive exceeds `backupConfig.health.maxBackupSize`.
   *
   * @param filename - The oversized backup archive filename.
   * @param size - The actual archive size in bytes.
   *
   * @todo Send email or in-app notification to admin.
   */
  private async notifyLargeBackup(filename: string, size: number): Promise<void> {
    this.logService.warn({
      message: 'Large backup detected',
      category: LogCategory.SYSTEM,
      metadata: { filename, size },
    })
  }

  /**
   * Logs a health check failure event.
   * Triggered when `backupConfig.notifications.onHealthCheckFailure` is enabled.
   *
   * @param issues - Array of human-readable issue descriptions detected during
   *   the health check.
   *
   * @todo Send email or in-app notification to admin.
   */
  private async notifyHealthCheckFailure(issues: string[]): Promise<void> {
    this.logService.error({
      message: 'Backup health check failed',
      category: LogCategory.SYSTEM,
      metadata: { issues },
    })
  }
}
