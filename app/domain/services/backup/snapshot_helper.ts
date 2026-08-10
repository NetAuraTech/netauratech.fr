import { createReadStream, createWriteStream } from 'node:fs'
import { unlink as defaultUnlink } from 'node:fs/promises'
import { createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import backupConfig from '#config/backup'
import { createEncryptionHelper, type EncryptionHelper } from '#helpers/core/encryption'

/**
 * SnapshotHelper — File system compression and encryption pipeline.
 *
 * Handles the sequential steps of compressing a SQL dump with gzip
 * and optionally encrypting it. Pure file I/O — no framework deps.
 *
 * **Dependency injection for testability**
 *
 * Constructor parameters prefixed with `_` are internal overrides. In production,
 * all are omitted and the real EncryptionHelper + `fs.unlink` are used. In tests,
 * pass stubs to isolate file I/O operations.
 *
 * @example Production usage
 *   new SnapshotHelper()
 *
 * @example Test usage
 *   new SnapshotHelper(encryptionMock, unlinkStub, { _encryptionEnabled: true })
 */
export class SnapshotHelper {
  private readonly compressionLevel: number
  private readonly encryptionEnabled: boolean
  private readonly encryptionHelper: EncryptionHelper | undefined
  private readonly unlinkFn: typeof defaultUnlink

  /**
   * @param _encryptionHelper - Optional EncryptionHelper override for testing.
   * @param _unlink - Optional fs.unlink override for testing.
   * @param opts - Optional config overrides. `_encryptionEnabled` forces the
   * encryption flag regardless of backup config (useful in tests).
   */
  constructor(
    _encryptionHelper?: EncryptionHelper,
    _unlink?: typeof defaultUnlink,
    opts?: { _encryptionEnabled?: boolean }
  ) {
    this.unlinkFn = _unlink ?? defaultUnlink
    this.compressionLevel = backupConfig.compression.level
    this.encryptionEnabled = opts?._encryptionEnabled ?? backupConfig.encryption.enabled
    if (this.encryptionEnabled) {
      this.encryptionHelper =
        _encryptionHelper ?? createEncryptionHelper(backupConfig.encryption.key.release())
    }
  }

  /**
   * Compress a file using gzip at the configured compression level.
   * Returns the path to the compressed file.
   */
  compress(inputPath: string): Promise<string> {
    const outputPath = `${inputPath}.gz`
    const input = createReadStream(inputPath)
    const output = createWriteStream(outputPath)
    const gzip = createGzip({ level: this.compressionLevel })
    return pipeline(input, gzip, output).then(() => outputPath)
  }

  /**
   * Encrypt a file using AES-256-CBC if encryption is enabled.
   * Deletes the unencrypted input after successful encryption.
   * Returns the path to the encrypted file (or original if disabled).
   */
  encrypt(inputPath: string): Promise<string> {
    if (!this.encryptionEnabled) return Promise.resolve(inputPath)
    const outputPath = `${inputPath}.enc`
    return this.encryptionHelper!.encryptFile(inputPath, outputPath).then(() => {
      return this.unlinkFn(inputPath).then(() => outputPath)
    })
  }

  /**
   * Generate the expected backup filename for a given type.
   * Extensions reflect configured compression and encryption settings.
   */
  static generateFilename(type: 'full' | 'differential'): string {
    const now = new Date()
    const date = now.toISOString().slice(0, 10) // yyyy-MM-dd
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '') // HHmmss

    let filename = `backup-${type}-${date}-${time}.sql`
    if (backupConfig.compression.enabled) filename += '.gz'
    if (backupConfig.encryption.enabled) filename += '.enc'
    return filename
  }

  /**
   * Derive the manifest filename from a backup filename.
   * Strips .sql/.gz/.enc extensions and appends .manifest.json.
   */
  static manifestFilename(backupFilename: string): string {
    return backupFilename.replace(/(\.(sql|gz|enc))+$/, '.manifest.json')
  }
}
