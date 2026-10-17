import { createReadStream, createWriteStream } from 'node:fs';
import { unlink as defaultUnlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { createGzip, createGunzip } from 'node:zlib';
import { createEncryptionHelper, type EncryptionHelper } from '#backup/services/encryption_helper';
import backupConfig from '#config/backup';

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
	private readonly compressionLevel: number;
	private readonly compressionEnabled: boolean;
	private readonly encryptionEnabled: boolean;
	private readonly encryptionHelper: EncryptionHelper | undefined;
	private readonly unlinkFn: typeof defaultUnlink;

	/**
	 * @param _encryptionHelper - Optional EncryptionHelper override for testing.
	 * @param _unlink - Optional fs.unlink override for testing.
	 * @param opts - Optional config overrides. `_encryptionEnabled` and
	 * `_compressionEnabled` force the respective flags regardless of backup
	 * config (useful in tests).
	 */
	constructor(
		_encryptionHelper?: EncryptionHelper,
		_unlink?: typeof defaultUnlink,
		opts?: { _encryptionEnabled?: boolean; _compressionEnabled?: boolean },
	) {
		this.unlinkFn = _unlink ?? defaultUnlink;
		this.compressionLevel = backupConfig.compression.level;
		this.compressionEnabled = opts?._compressionEnabled ?? backupConfig.compression.enabled;
		this.encryptionEnabled = opts?._encryptionEnabled ?? backupConfig.encryption.enabled;
		if (this.encryptionEnabled) {
			this.encryptionHelper = _encryptionHelper ?? createEncryptionHelper(backupConfig.encryption.key.release());
		}
	}

	/**
	 * Compress a file using gzip at the configured compression level.
	 * Returns the path to the compressed file.
	 */
	compress(inputPath: string): Promise<string> {
		const outputPath = `${inputPath}.gz`;
		const input = createReadStream(inputPath);
		const output = createWriteStream(outputPath);
		const gzip = createGzip({ level: this.compressionLevel });
		return pipeline(input, gzip, output).then(() => outputPath);
	}

	/**
	 * Decompress a gzip file if compression is enabled.
	 * Deletes the compressed input after successful decompression.
	 * Returns the path to the decompressed file (or original if disabled).
	 */
	decompress(inputPath: string): Promise<string> {
		if (!this.compressionEnabled) return Promise.resolve(inputPath);
		const outputPath = inputPath.slice(0, -'.gz'.length);
		const input = createReadStream(inputPath);
		const output = createWriteStream(outputPath);
		const gunzip = createGunzip();
		return pipeline(input, gunzip, output).then(() => {
			return this.unlinkFn(inputPath).then(() => outputPath);
		});
	}

	/**
	 * Encrypt a file using AES-256-CBC if encryption is enabled.
	 * Deletes the unencrypted input after successful encryption.
	 * Returns the path to the encrypted file (or original if disabled).
	 */
	encrypt(inputPath: string): Promise<string> {
		if (!this.encryptionEnabled) return Promise.resolve(inputPath);
		const outputPath = `${inputPath}.enc`;
		return this.encryptionHelper!.encryptFile(inputPath, outputPath).then(() => {
			return this.unlinkFn(inputPath).then(() => outputPath);
		});
	}

	/**
	 * Decrypt a file using AES-256-CBC if encryption is enabled.
	 * Deletes the encrypted input after successful decryption.
	 * Returns the path to the decrypted file (or original if disabled).
	 */
	decrypt(inputPath: string): Promise<string> {
		if (!this.encryptionEnabled) return Promise.resolve(inputPath);
		const outputPath = inputPath.slice(0, -'.enc'.length);
		return this.encryptionHelper!.decryptFile(inputPath, outputPath).then(() => {
			return this.unlinkFn(inputPath).then(() => outputPath);
		});
	}
}
