import backupConfig from '#config/backup';
import { ValueObject } from '#core/domain/value_object';
import type { BackupType } from '#backup/types/backup';

/**
 * Pure domain object for a backup artifact stored on the configured disk.
 *
 * Owns the backup filename grammar — `backup-<type>-<date>-<time>.sql[.gz][.enc]` —
 * so artifact naming, manifest naming, and filename parsing live in exactly one
 * place instead of being re-implemented per caller. Backup artifacts are managed
 * directly on the Drive disk (no ORM persistence), so this value object is the
 * domain's only persistence-adjacent type.
 */
export class BackupMetadata extends ValueObject<{
	filename: string;
	type: BackupType;
	size: number;
	createdAt: Date;
	path: string;
}> {
	/**
	 * The grammar of a backup artifact filename: a strategy type and a
	 * `YYYY-MM-DD`/`HHmmss` timestamp, followed by the optional
	 * `.sql[.gz][.enc]` extension stack.
	 */
	private static readonly FILENAME_PATTERN = /^backup-(full|differential)-(\d{4}-\d{2}-\d{2})-(\d{6})/;

	private constructor(
		readonly filename: string,
		readonly type: BackupType,
		readonly size: number,
		readonly createdAt: Date,
		readonly path: string,
	) {
		super({ filename, type, size, createdAt, path });
	}

	/**
	 * Generate the artifact filename for a strategy type:
	 * `backup-<type>-<date>-<time>.sql`, with the configured compression and
	 * encryption extensions appended in that order.
	 */
	static generateFilename(type: BackupType): string {
		const now = new Date();
		const date = now.toISOString().slice(0, 10); // yyyy-MM-dd
		const time = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHmmss

		let filename = `backup-${type}-${date}-${time}.sql`;
		if (backupConfig.compression.enabled) filename += '.gz';
		if (backupConfig.encryption.enabled) filename += '.enc';
		return filename;
	}

	/**
	 * Derive the manifest filename from a backup filename: strips the
	 * `.sql`/`.gz`/`.enc` extension stack and appends `.manifest.json`.
	 */
	static manifestFilename(backupFilename: string): string {
		return backupFilename.replace(/(\.(sql|gz|enc))+$/, '.manifest.json');
	}

	/**
	 * Parse the strategy type and the embedded timestamp out of a backup
	 * filename. Returns `null` when the filename does not follow the grammar.
	 *
	 * @param filename - The artifact filename (relative to the storage prefix).
	 */
	static parseFilename(filename: string): { type: BackupType; createdAt: Date } | null {
		const match = filename.match(BackupMetadata.FILENAME_PATTERN);
		if (!match) return null;

		return {
			type: match[1] as BackupType,
			createdAt: BackupMetadata.parseTimestamp(match[2], match[3]),
		};
	}

	/**
	 * Build the metadata of a stored artifact, or `null` when the filename does
	 * not follow the backup grammar. The creation date falls back to the
	 * timestamp embedded in the filename when the storage metadata carries no
	 * last-modified stamp.
	 *
	 * @param filename - The artifact filename (relative to the storage prefix).
	 * @param meta - The storage metadata of the object (size, last-modified stamp).
	 * @param path - The full storage key of the object.
	 */
	static fromStorageObject(
		filename: string,
		meta: { contentLength?: number; lastModified?: Date },
		path: string,
	): BackupMetadata | null {
		const parsed = BackupMetadata.parseFilename(filename);
		if (!parsed) return null;

		return new BackupMetadata(
			filename,
			parsed.type,
			meta.contentLength || 0,
			meta.lastModified ?? parsed.createdAt,
			path,
		);
	}

	/**
	 * Reconstructs a `Date` from the date and time fragments in a backup
	 * filename.
	 *
	 * @param date - Date segment in `YYYY-MM-DD` format.
	 * @param time - Time segment as a 6-digit string `HHmmss`.
	 */
	private static parseTimestamp(date: string, time: string): Date {
		const [year, month, day] = date.split('-').map(Number);
		const hour = Number.parseInt(time.slice(0, 2));
		const minute = Number.parseInt(time.slice(2, 4));
		const second = Number.parseInt(time.slice(4, 6));
		return new Date(year, month - 1, day, hour, minute, second);
	}
}
