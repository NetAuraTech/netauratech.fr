import { inject } from '@adonisjs/core';
import { BackupPipeline } from '#backup/services/backup_pipeline';
import { LogService } from '#log/services/log_service';

interface RestoreBackupPayload {
	filename: string;
}

/**
 * Restore a backup file to the database by delegating to
 * {@link BackupPipeline.restore}, which handles download, decryption,
 * decompression, and the `psql` replay.
 */
@inject()
export class RestoreBackupAction {
	constructor(protected logService: LogService) {}

	/**
	 * Execute backup restoration.
	 *
	 * @param payload - The backup filename to restore.
	 * @returns An object indicating success or failure with an optional error message.
	 *
	 * @example
	 * const result = await restoreBackupAction.execute({ filename: 'backup-full-2024-01-01-120000.sql.gz.enc' })
	 */
	async execute(payload: RestoreBackupPayload): Promise<{ success: boolean; error?: string }> {
		return new BackupPipeline(this.logService).restore(payload.filename);
	}
}
