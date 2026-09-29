import crypto from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import type { ReadStream, WriteStream } from 'node:fs';

/**
 * AES-256-GCM encryption helper for backup files and arbitrary data.
 *
 * Each encryption generates:
 * - Random 16-byte salt → unique key derivation
 * - Random 12-byte IV → unique nonce per encryption
 * - AES-256-GCM ciphertext + 16-byte auth tag
 *
 * Ciphertext format: [version(1)][salt(16)][iv(12)][ciphertext][tag(16)]
 *
 * Legacy CBC format (v0): [iv(16)][ciphertext] — auto-detected and re-encrypted on read.
 */
export class EncryptionHelper {
	private readonly keyLength = 32; // AES-256
	private readonly saltLength = 16; // 128-bit salt
	private readonly ivLength = 12; // 96-bit IV (GCM recommended)
	private readonly tagLength = 16; // 128-bit auth tag
	private readonly algorithm = 'aes-256-gcm';
	private readonly version = 1; // v1 = GCM format

	constructor(private readonly appKey: string) {}

	/**
	 * Derives encryption key from appKey + salt using scrypt.
	 * @param salt - Random salt (16 bytes)
	 */
	private deriveKey(salt: Buffer): Buffer {
		return crypto.scryptSync(this.appKey, salt, this.keyLength);
	}

	/**
	 * Legacy CBC decryption (v0 format: [iv(16)][ciphertext]).
	 * Used for backward compatibility with existing backups.
	 */
	private decryptLegacyCbc(encryptedData: Buffer): Buffer {
		const legacyKey = crypto.scryptSync(this.appKey, 'salt', this.keyLength);
		const iv = encryptedData.subarray(0, 16);
		const ciphertext = encryptedData.subarray(16);
		const decipher = crypto.createDecipheriv('aes-256-cbc', legacyKey, iv);
		return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	}

	/**
	 * Encrypts a file using AES-256-GCM with random salt/IV.
	 * Streams to disk — constant memory regardless of file size.
	 */
	async encryptFile(inputPath: string, outputPath: string): Promise<void> {
		const salt = crypto.randomBytes(this.saltLength);
		const iv = crypto.randomBytes(this.ivLength);
		const key = this.deriveKey(salt);

		const cipher = crypto.createCipheriv(this.algorithm, key, iv, {
			authTagLength: this.tagLength,
		});

		const input: ReadStream = createReadStream(inputPath);
		const output: WriteStream = createWriteStream(outputPath);

		// Write header: version || salt || iv
		output.write(Buffer.concat([Buffer.from([this.version]), salt, iv]));

		await pipeline(input, cipher, output);

		// Append auth tag after ciphertext
		output.write(cipher.getAuthTag());
	}

	/**
	 * Decrypts a file encrypted with encryptFile().
	 * Supports both v1 (GCM) and v0 (legacy CBC) formats.
	 * Legacy files are automatically re-encrypted to v1 format on read.
	 */
	async decryptFile(inputPath: string, outputPath: string): Promise<void> {
		const { readFile, writeFile } = await import('node:fs/promises');

		const encryptedData = await readFile(inputPath);

		// Detect version from first byte
		const version = encryptedData[0];

		if (version === this.version) {
			// v1: GCM format [v1][salt(16)][iv(12)][ciphertext][tag(16)]
			await this.decryptGcmFile(encryptedData, outputPath);
		} else {
			// v0: Legacy CBC format [iv(16)][ciphertext] (no version byte)
			const legacyPlaintext = this.decryptLegacyCbc(encryptedData);
			await writeFile(outputPath, legacyPlaintext);

			// Re-encrypt to v1 GCM format for future reads
			await this.encryptFile(outputPath, inputPath);
		}
	}

	/**
	 * Internal: decrypt v1 GCM file data.
	 */
	private async decryptGcmFile(encryptedData: Buffer, outputPath: string): Promise<void> {
		const { writeFile } = await import('node:fs/promises');

		const minLength = 1 + this.saltLength + this.ivLength + this.tagLength;
		if (encryptedData.length < minLength) {
			throw new Error('Invalid encrypted file: too short for GCM format');
		}

		// Parse: [version(1)][salt(16)][iv(12)][ciphertext][tag(16)]
		const salt = encryptedData.subarray(1, 1 + this.saltLength);
		const iv = encryptedData.subarray(1 + this.saltLength, 1 + this.saltLength + this.ivLength);
		const ciphertext = encryptedData.subarray(1 + this.saltLength + this.ivLength, -this.tagLength);
		const authTag = encryptedData.subarray(-this.tagLength);

		const key = this.deriveKey(salt);
		const decipher = crypto.createDecipheriv(this.algorithm, key, iv, {
			authTagLength: this.tagLength,
		});
		decipher.setAuthTag(authTag);

		const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]); // throws if auth tag invalid
		await writeFile(outputPath, decrypted);
	}

	/**
	 * Encrypts a buffer/string in memory.
	 * Returns: [version(1)][salt(16)][iv(12)][ciphertext][tag(16)]
	 */
	encrypt(data: Buffer | string): Buffer {
		const salt = crypto.randomBytes(this.saltLength);
		const iv = crypto.randomBytes(this.ivLength);
		const key = this.deriveKey(salt);

		const cipher = crypto.createCipheriv(this.algorithm, key, iv, {
			authTagLength: this.tagLength,
		});

		const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
		const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
		const authTag = cipher.getAuthTag();

		return Buffer.concat([Buffer.from([this.version]), salt, iv, ciphertext, authTag]);
	}

	/**
	 * Decrypts a buffer previously encrypted with encrypt().
	 * Supports both v1 (GCM) and v0 (legacy CBC) formats.
	 * Throws if auth tag verification fails (tampering detected).
	 */
	decrypt(data: Buffer): Buffer {
		if (data.length === 0) {
			throw new Error('Invalid encrypted data: empty');
		}

		const version = data[0];

		if (version === this.version) {
			// v1: GCM format [v1][salt(16)][iv(12)][ciphertext][tag(16)]
			const minLength = 1 + this.saltLength + this.ivLength + this.tagLength;
			if (data.length < minLength) {
				throw new Error('Invalid encrypted data: too short for GCM format');
			}

			const salt = data.subarray(1, 1 + this.saltLength);
			const iv = data.subarray(1 + this.saltLength, 1 + this.saltLength + this.ivLength);
			const ciphertext = data.subarray(1 + this.saltLength + this.ivLength, -this.tagLength);
			const authTag = data.subarray(-this.tagLength);

			const key = this.deriveKey(salt);
			const decipher = crypto.createDecipheriv(this.algorithm, key, iv, {
				authTagLength: this.tagLength,
			});
			decipher.setAuthTag(authTag);

			return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
		} else {
			// v0: Legacy CBC format [iv(16)][ciphertext] (no version byte)
			if (data.length < 16) {
				throw new Error('Invalid encrypted data: too short for legacy format');
			}
			return this.decryptLegacyCbc(data);
		}
	}
}

/**
 * Convenience factory that creates an {@link EncryptionHelper} from the application key.
 *
 * @param appKey - The application secret key (e.g. `APP_KEY` environment variable).
 * @returns A new {@link EncryptionHelper} instance.
 */
export function createEncryptionHelper(appKey: string): EncryptionHelper {
	return new EncryptionHelper(appKey);
}
