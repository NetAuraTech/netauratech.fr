import { inject } from '@adonisjs/core';
import { BackupPipeline } from '#backup/services/backup_pipeline';
import { LogService } from '#log/services/log_service';
import type { BackupResult, BackupStrategy } from '#backup/types/backup';

export interface RunBackupPayload {
	strategy?: BackupStrategy;
}

/**
 * RunBackupAction — Thin orchestrator action for backup execution.
 *
 * Delegates all logic to {@link BackupPipeline} which resolves the strategy
 * and runs the full pipeline (dump → compress → encrypt → manifest → upload).
 */
@inject()
export class RunBackupAction {
	constructor(protected logService: LogService) {}

	/**
	 * Execute a backup run.
	 *
	 * @param payload - Optional strategy override. `'auto'` (default) selects
	 *   full on the configured `fullBackupDay`, differential on all other days.
	 * @returns A {@link BackupResult} describing the outcome.
	 *
	 * @example
	 * await runBackupAction.execute({ strategy: 'full' })
	 */
	public async execute(payload?: RunBackupPayload): Promise<BackupResult> {
		const strategy = payload?.strategy ?? 'auto';
		return new BackupPipeline(this.logService).run(strategy);
	}
}
