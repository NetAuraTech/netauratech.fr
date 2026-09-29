import i18nManager from '@adonisjs/i18n/services/main';
import { beforeDelete, belongsTo, column, hasMany } from '@adonisjs/lucid/orm';
import { FileSchema } from '#database/schema';
import { File as FileDomain } from '#file/domain/file';
import FileAlt from '#file/models/file_alt';
import FileFolder from '#file/models/file_folder';
import User from '#identity/models/user';
import type { StorageDisk } from '#types/file';
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations';

export default class File extends FileSchema {
	@column()
	declare disk: StorageDisk;

	@belongsTo(() => FileFolder, { foreignKey: 'folderId' })
	declare folder: BelongsTo<typeof FileFolder>;

	@hasMany(() => FileAlt, { foreignKey: 'fileId' })
	declare alts: HasMany<typeof FileAlt>;

	/**
	 * Lazy-loaded to avoid circular import — User model lives in a different domain.
	 */
	@belongsTo(() => User, { foreignKey: 'uploadedBy' })
	declare uploader: BelongsTo<typeof User>;

	// ─── Hooks ────────────────────────────────────────────────────────────────

	/**
	 * Deletes the physical file from storage before the DB record is removed.
	 * StorageService is resolved inline to avoid circular DI at module load time.
	 */
	@beforeDelete()
	static async deletePhysicalFile(file: File) {
		const { StorageService } = await import('#file/services/storage_service');
		const storageService = new StorageService();
		await storageService.delete(file.path, file.disk);
	}

	// ─── Helpers ──────────────────────────────────────────────────────────────

	/**
	 * Returns the public URL for this file on its storage disk.
	 */
	async url(): Promise<string> {
		const { StorageService } = await import('#file/services/storage_service');
		const storageService = new StorageService();
		return storageService.url(this.path, this.disk);
	}

	/**
	 * Resolves the alt text for a given display intent using a single shared
	 * priority chain, in order:
	 *
	 * 1. Keyed {@link FileAlt} for the requested locale.
	 * 2. Keyed {@link FileAlt} for the default locale.
	 * 3. Keyed {@link FileAlt} in any locale.
	 * 4. The first alt entry (fallback for unkeyed intents).
	 * 5. The inline override.
	 *
	 * The same chain serves CMS image blocks and manual front pages, so alt
	 * resolution never drifts between the two rendering paths. The chain
	 * itself is owned by the pure domain {@link FileDomain} object.
	 *
	 * @param locale - The current page locale
	 * @param key - The named alt key (e.g. "hero"), or null when none is requested
	 * @param override - Optional inline override, used only when no alt matches
	 */
	resolveAlt(locale: string, key: string | null, override?: string | null): string {
		return this.toDomain().resolveAlt(locale, i18nManager.defaultLocale, key, override ?? null);
	}

	/**
	 * Project this model onto its pure domain representation. The alt-text
	 * resolution priority chain lives on the domain object; `resolveAlt`
	 * above is a thin delegation.
	 */
	toDomain(): FileDomain {
		return FileDomain.fromModel({
			id: this.id,
			filename: this.filename,
			originalName: this.originalName,
			mimeType: this.mimeType,
			extension: this.extension,
			size: Number(this.size),
			path: this.path,
			disk: this.disk,
			folderId: this.folderId,
			alts: (this.alts ?? []) as { locale: string; key: string; value: string }[],
			createdAt: this.createdAt?.toJSDate() ?? null,
		});
	}
}
