import drive from '@adonisjs/drive/services/main'
import { readFile as defaultReadFile } from 'node:fs/promises'
import backupConfig from '#config/backup'
import { type DriveDirectory, type DriveFile } from '@adonisjs/drive'

/**
 * StorageUploader — Thin wrapper around AdonisJS Drive service.
 *
 * Non-DI class: imported and instantiated directly, no @inject().
 * Makes mocking easier in tests while preserving the configured
 * disk and prefix from backup config.
 *
 * **Dependency injection for testability**
 *
 * Constructor parameters prefixed with `_` are internal overrides. In production,
 * both are omitted and the real Drive disk + `fs.readFile` are used. In tests,
 * pass fake instances to isolate storage I/O.
 *
 * @example Production usage
 *   new StorageUploader()
 *
 * @example Test usage
 *   new StorageUploader(fakeDisk, readFileStub)
 */
export class StorageUploader {
  private disk
  private readonly readFileFn: typeof defaultReadFile

  /**
   * @param _disk - Optional Drive disk override for testing.
   * @param _readFile - Optional fs.readFile override for testing.
   */
  constructor(_disk?: ReturnType<typeof drive.use>, _readFile?: typeof defaultReadFile) {
    this.disk = _disk ?? drive.use(backupConfig.storage.disk as Parameters<typeof drive.use>[0])
    this.readFileFn = _readFile ?? defaultReadFile
  }

  /**
   * Build the full storage path for a backup filename.
   */
  buildPath(filename: string): string {
    return `${backupConfig.storage.prefix}/${filename}`
  }

  /**
   * Upload a local file to the configured storage disk.
   */
  async upload(localPath: string, filename: string): Promise<void> {
    const contents = await this.readFileFn(localPath)
    const remotePath = this.buildPath(filename)
    await this.disk.put(remotePath, contents, { contentType: 'application/octet-stream' })
  }

  /**
   * List all backup objects under the configured prefix.
   */
  async listBackups(): Promise<Iterable<DriveFile | DriveDirectory>> {
    const prefix = `${backupConfig.storage.prefix}/`
    const { objects } = await this.disk.listAll(prefix)
    return objects
  }

  /**
   * Get metadata for a stored object.
   */
  async getMetaData(key: string): Promise<{ contentLength?: number; lastModified?: Date }> {
    return this.disk.getMetaData(key)
  }
}
