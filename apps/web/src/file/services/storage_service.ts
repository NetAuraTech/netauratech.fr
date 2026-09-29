import drive from '@adonisjs/drive/services/main';
import env from '#start/env';
import type { StorageDisk } from '#types/file';

/**
 * Abstraction layer over AdonisJS Drive for the CMS filesystem.
 *
 * All CMS files are stored under the `cms/` prefix to avoid colliding with
 * the `backup/` folder used by the backup system. The active disk is resolved
 * from `CMS_STORAGE_DISK` in the environment and must match one of the keys
 * declared in `config/drive.ts` (`local`, `s3`, or `r2`).
 *
 * This service is intentionally thin — it delegates all actual I/O to
 * AdonisJS Drive and only adds path prefixing, env-based disk resolution,
 * and silent-delete semantics.
 */
export class StorageService {
	private readonly prefix = 'cms';

	/**
	 * Returns the configured CMS storage disk from the environment.
	 * Falls back to `'fs'` if `CMS_STORAGE_DISK` is not set.
	 */
	disk(): StorageDisk {
		return env.get('CMS_STORAGE_DISK', 'fs') as StorageDisk;
	}

	/**
	 * Builds the full storage path for a file, prefixed with `cms/`.
	 *
	 * @param relativePath - Path relative to the CMS root (e.g. `files/photo.jpg`)
	 * @returns The full storage path (e.g. `cms/files/photo.jpg`)
	 */
	buildPath(relativePath: string): string {
		return `${this.prefix}/${relativePath}`;
	}

	/**
	 * Uploads a buffer to the given path on the given disk.
	 *
	 * @param contents - File contents as a `Buffer` or `Uint8Array`
	 * @param path - Full storage path (already prefixed via {@link buildPath})
	 * @param disk - Target storage disk
	 * @param options - Optional content type and visibility
	 * @throws If the underlying Drive adapter fails to write the file
	 */
	async upload(
		contents: Buffer | Uint8Array,
		path: string,
		disk: StorageDisk,
		options?: { contentType?: string; visibility?: 'public' | 'private' },
	): Promise<void> {
		// Cast required because DriveDisks is augmented by the user's config/drive.ts
		// and TypeScript cannot infer that StorageDisk ⊆ keyof DriveDisks at compile time.
		const d = drive.use(disk as Parameters<typeof drive.use>[0]);
		await d.put(path, contents, {
			contentType: options?.contentType,
			visibility: options?.visibility ?? 'public',
		});
	}

	/**
	 * Deletes a file from the given disk.
	 * Silently ignores the error when the file no longer exists on disk —
	 * this prevents hard failures during model `beforeDelete` hooks when
	 * the file was already removed manually.
	 *
	 * @param path - Full storage path
	 * @param disk - Storage disk the file lives on
	 */
	async delete(path: string, disk: StorageDisk): Promise<void> {
		try {
			const d = drive.use(disk as Parameters<typeof drive.use>[0]);
			await d.delete(path);
		} catch {
			// File already gone — not an application error
		}
	}

	/**
	 * Returns the public URL for a stored file.
	 *
	 * @param path - Full storage path
	 * @param disk - Storage disk the file lives on
	 * @returns The public URL string
	 * @throws If the adapter cannot generate a URL (e.g. private visibility)
	 */
	async url(path: string, disk: StorageDisk): Promise<string> {
		const d = drive.use(disk as Parameters<typeof drive.use>[0]);
		return d.getUrl(path);
	}

	/**
	 * Checks whether a file exists on the given disk.
	 *
	 * @param path - Full storage path
	 * @param disk - Storage disk to check
	 * @returns `true` if the file exists, `false` otherwise
	 */
	async exists(path: string, disk: StorageDisk): Promise<boolean> {
		const d = drive.use(disk as Parameters<typeof drive.use>[0]);
		return d.exists(path);
	}
}
