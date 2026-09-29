/**
 * Shared backup types.
 *
 * The result and context contracts shared by the backup pipeline, the
 * backup engine, and the backup actions.
 */

/** The kind of a backup artifact: a full dump or a delta on top of the last full. */
export type BackupType = 'full' | 'differential';

/** A backup strategy: an explicit kind, or `auto` to follow the configured schedule. */
export type BackupStrategy = BackupType | 'auto';

export interface BackupResult {
	success: boolean;
	filename: string;
	type: BackupType;
	size: number;
	duration: number;
	storage: string;
	error?: string;
}

/**
 * Context shared across the pipeline and helpers.
 * All external dependencies are passed in here to keep the pipeline
 * instantiable without DI.
 */
export interface BackupContext {
	tempDir: string;
	filename: string;
	strategyType: BackupType;
}
