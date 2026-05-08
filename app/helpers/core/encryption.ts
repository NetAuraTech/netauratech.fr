import crypto from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import type { ReadStream, WriteStream } from 'node:fs'

/**
 * AES-256-CBC encryption helper for backup files and arbitrary data.
 *
 * The encryption key is derived from the application's `APP_KEY` using
 * `scrypt`, producing a stable 32-byte key suitable for AES-256.
 * Every encrypted payload prepends a randomly generated 16-byte IV so
 * that identical inputs produce distinct ciphertexts.
 *
 * Two operation modes are available:
 * - **Streaming** (`encryptFile` / `decryptFile`) — for large files, piped
 *   directly through the cipher without loading the entire content into memory.
 * - **In-memory** (`encrypt` / `decrypt`) — for small buffers or strings.
 *
 * @example
 * const helper = new EncryptionHelper(env.get('APP_KEY'))
 * await helper.encryptFile('/tmp/backup.zip', '/tmp/backup.zip.enc')
 * await helper.decryptFile('/tmp/backup.zip.enc', '/tmp/backup.zip')
 */
export class EncryptionHelper {
  private algorithm = 'aes-256-cbc'
  private readonly key: Buffer
  private ivLength = 16

  /**
   * Derives a 32-byte AES-256 key from the provided application key using `scrypt`.
   *
   * The same `appKey` will always produce the same derived key, making
   * the helper safe to instantiate multiple times across the application
   * lifecycle.
   *
   * @param appKey - The application secret key (e.g. `APP_KEY` environment variable).
   */
  constructor(appKey: string) {
    this.key = crypto.scryptSync(appKey, 'salt', 32)
  }

  /**
   * Encrypts a file using AES-256-CBC and writes the result to a new file.
   *
   * A fresh random IV is generated for each call and prepended to the output
   * file as the first 16 bytes. The input is piped through the cipher stream
   * directly to disk, keeping memory usage constant regardless of file size.
   *
   * @param inputPath - Absolute path to the plaintext file to encrypt.
   * @param outputPath - Absolute path where the encrypted file will be written.
   *
   * @example
   * await helper.encryptFile('/tmp/backup.zip', '/tmp/backup.zip.enc')
   */
  async encryptFile(inputPath: string, outputPath: string): Promise<void> {
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)

    const input: ReadStream = createReadStream(inputPath)
    const output: WriteStream = createWriteStream(outputPath)

    output.write(iv)

    await pipeline(input, cipher, output)
  }

  /**
   * Decrypts a file previously encrypted with {@link encryptFile}.
   *
   * Reads the entire encrypted file into memory, extracts the IV from the
   * first 16 bytes, decrypts the remainder, and writes the plaintext to the
   * output path.
   *
   * > **Note:** Unlike `encryptFile`, this method loads the full file into
   * > memory. Avoid using it for very large files.
   *
   * @param inputPath - Absolute path to the encrypted file (IV prepended).
   * @param outputPath - Absolute path where the decrypted file will be written.
   *
   * @example
   * await helper.decryptFile('/tmp/backup.zip.enc', '/tmp/backup.zip')
   */
  async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    const { readFile, writeFile } = await import('node:fs/promises')

    const encryptedData = await readFile(inputPath)

    const iv = encryptedData.subarray(0, this.ivLength)
    const encrypted = encryptedData.subarray(this.ivLength)

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

    await writeFile(outputPath, decrypted)
  }

  /**
   * Encrypts a buffer or string in memory using AES-256-CBC.
   *
   * A fresh random IV is generated for each call and prepended to the
   * returned buffer. The output format is `[IV (16 bytes)][ciphertext]`.
   *
   * @param data - Plaintext data to encrypt. Strings are encoded as UTF-8.
   * @returns A `Buffer` containing the IV followed by the ciphertext.
   *
   * @example
   * const encrypted = helper.encrypt('sensitive data')
   * const decrypted = helper.decrypt(encrypted).toString('utf-8')
   */
  encrypt(data: Buffer | string): Buffer {
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)

    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8')
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])

    return Buffer.concat([iv, encrypted])
  }

  /**
   * Decrypts a buffer previously encrypted with {@link encrypt}.
   *
   * Expects the input to be in the format `[IV (16 bytes)][ciphertext]`
   * as produced by {@link encrypt}.
   *
   * @param data - Encrypted buffer with the IV prepended.
   * @returns A `Buffer` containing the decrypted plaintext.
   *
   * @example
   * const decrypted = helper.decrypt(encrypted).toString('utf-8')
   */
  decrypt(data: Buffer): Buffer {
    const iv = data.subarray(0, this.ivLength)
    const encrypted = data.subarray(this.ivLength)

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
    return Buffer.concat([decipher.update(encrypted), decipher.final()])
  }
}

/**
 * Convenience factory that creates an {@link EncryptionHelper} from the
 * application key.
 *
 * @param appKey - The application secret key (e.g. `APP_KEY` environment variable).
 * @returns A new {@link EncryptionHelper} instance.
 *
 * @example
 * const helper = createEncryptionHelper(env.get('APP_KEY'))
 */
export function createEncryptionHelper(appKey: string): EncryptionHelper {
  return new EncryptionHelper(appKey)
}
