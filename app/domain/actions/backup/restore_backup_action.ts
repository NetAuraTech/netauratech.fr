import { inject } from '@adonisjs/core'
import drive from '@adonisjs/drive/services/main'
import backupConfig from '#config/backup'
import { spawn, type ChildProcess } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { createGunzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import env from '#start/env'
import { LogService } from '#services/logging/log_service'
import { LogCategory } from '#types/logging'
import { createEncryptionHelper } from '#helpers/core/encryption'

interface RestoreBackupPayload {
  filename: string
}

/**
 * Restore a backup file to the database by downloading, decrypting, decompressing,
 * and running the SQL dump via `psql`.
 */
@inject()
export class RestoreBackupAction {
  private encryptionHelper = createEncryptionHelper(backupConfig.encryption.key.release())
  private tempDir = 'storage/temp/backups'

  constructor(protected logService: LogService) {}

  private getDisk() {
    return drive.use(backupConfig.storage.disk as Parameters<typeof drive.use>[0])
  }

  private buildPath(filename: string): string {
    return `${backupConfig.storage.prefix}/${filename}`
  }

  /**
   * Execute backup restoration.
   *
   * @param payload - The backup filename to restore.
   * @returns An object indicating success or failure with an optional error message.
   *
   * @example
   * const result = await restoreBackupAction.execute({ filename: 'backup-full-2024-01-01-120000.sql.gz.enc' })
   */
  async execute(payload: RestoreBackupPayload): Promise<{ success: boolean; error?: string }> {
    const { filename } = payload

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

  private async downloadFromDrive(filename: string, localPath: string): Promise<void> {
    const disk = this.getDisk()
    const remotePath = this.buildPath(filename)
    const stream = await disk.getStream(remotePath)

    await mkdir(join(localPath, '..'), { recursive: true })
    const writeStream = createWriteStream(localPath)
    await pipeline(stream as any, writeStream)
  }

  private async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    if (!backupConfig.encryption.enabled) return
    await this.encryptionHelper.decryptFile(inputPath, outputPath)
  }

  private async decompressFile(inputPath: string, outputPath: string): Promise<void> {
    const { createReadStream } = await import('node:fs')
    const input = createReadStream(inputPath)
    const output = createWriteStream(outputPath)
    const gunzip = createGunzip()
    await pipeline(input, gunzip, output)
  }

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
}
