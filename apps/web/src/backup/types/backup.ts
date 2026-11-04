/**
 * Shared backup types.
 *
 * The result and context contracts shared by the backup pipeline and the
 * backup actions.
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
 * The outcome of a restore attempt: a failure carries the error message,
 * and the failure's stable error code when it has one.
 */
export interface RestoreResult {
	success: boolean;
	error?: string;
	code?: string;
}

/**
 * The manifest persisted alongside a backup artifact on the configured
 * disk. A full manifest carries only its table list; a differential
 * manifest also records the full backup it is a delta on.
 */
export type BackupManifest =
	| {
			/** The tables the artifact's dump contains. */
			tables: string[];
	  }
	| {
			/** The kind of a differential manifest. */
			type: Extract<BackupType, 'differential'>;
			/** The tables the artifact's dump contains. */
			tables: string[];
			/** The filename of the base full backup. */
			fullBackupReference: string;
	  };

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
