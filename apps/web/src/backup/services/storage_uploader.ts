import { createWriteStream as defaultCreateWriteStream } from 'node:fs';
import { mkdir as defaultMkdir, readFile as defaultReadFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline as defaultPipeline } from 'node:stream/promises';
import { type DriveDirectory, type DriveFile } from '@adonisjs/drive';
import drive from '@adonisjs/drive/services/main';
import backupConfig from '#config/backup';

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
	private disk;
	private readonly readFileFn: typeof defaultReadFile;
	private readonly mkdirFn: typeof defaultMkdir;
	private readonly createWriteStreamFn: typeof defaultCreateWriteStream;
	private readonly pipelineFn: typeof defaultPipeline;

	/**
	 * @param _disk - Optional Drive disk override for testing.
	 * @param _readFile - Optional fs.readFile override for testing.
	 * @param opts - Optional overrides for the file-system stream mechanics
	 *   used by {@link download}: `_mkdir`, `_createWriteStream`, `_pipeline`.
	 */
	constructor(
		_disk?: ReturnType<typeof drive.use>,
		_readFile?: typeof defaultReadFile,
		opts?: {
			_mkdir?: typeof defaultMkdir;
			_createWriteStream?: typeof defaultCreateWriteStream;
			_pipeline?: typeof defaultPipeline;
		},
	) {
		this.disk = _disk ?? drive.use(backupConfig.storage.disk as Parameters<typeof drive.use>[0]);
		this.readFileFn = _readFile ?? defaultReadFile;
		this.mkdirFn = opts?._mkdir ?? defaultMkdir;
		this.createWriteStreamFn = opts?._createWriteStream ?? defaultCreateWriteStream;
		this.pipelineFn = opts?._pipeline ?? defaultPipeline;
	}

	/**
	 * Build the full storage path for a backup filename.
	 */
	buildPath(filename: string): string {
		return `${backupConfig.storage.prefix}/${filename}`;
	}

	/**
	 * Upload a local file to the configured storage disk.
	 */
	async upload(localPath: string, filename: string): Promise<void> {
		const contents = await this.readFileFn(localPath);
		const remotePath = this.buildPath(filename);
		await this.disk.put(remotePath, contents, { contentType: 'application/octet-stream' });
	}

	/**
	 * Check whether a backup artifact exists on the configured disk.
	 */
	async exists(filename: string): Promise<boolean> {
		return this.disk.exists(this.buildPath(filename));
	}

	/**
	 * Download a backup artifact from the configured disk to a local file,
	 * creating the parent directory when needed.
	 */
	async download(filename: string, localPath: string): Promise<void> {
		const remotePath = this.buildPath(filename);
		const stream = await this.disk.getStream(remotePath);
		await this.mkdirFn(join(localPath, '..'), { recursive: true });
		const writeStream = this.createWriteStreamFn(localPath);
		await this.pipelineFn(stream as any, writeStream);
	}

	/**
	 * Delete a backup artifact from the configured disk.
	 */
	async delete(filename: string): Promise<void> {
		await this.disk.delete(this.buildPath(filename));
	}

	/**
	 * List all backup objects under the configured prefix.
	 */
	async listBackups(): Promise<Iterable<DriveFile | DriveDirectory>> {
		const prefix = `${backupConfig.storage.prefix}/`;
		const { objects } = await this.disk.listAll(prefix);
		return objects;
	}

	/**
	 * Get metadata for a stored object.
	 */
	async getMetaData(key: string): Promise<{ contentLength?: number; lastModified?: Date }> {
		return this.disk.getMetaData(key);
	}
}
