import { inject } from '@adonisjs/core';
import app from '@adonisjs/core/services/app';
import { BackupEngine } from '#backup/services/backup_engine';
import backupConfig from '#config/backup';
import type { BackupResult, BackupStrategy } from '#backup/types/backup';

export interface RunBackupPayload {
	strategy?: BackupStrategy;
}

/**
 * RunBackupAction — Thin orchestrator action for backup execution.
 *
 * Delegates all logic to BackupEngine which selects the appropriate
 * strategy and runs the full pipeline (dump → compress → encrypt →
 * manifest → upload).
 */
@inject()
export class RunBackupAction {
	/**
	 * Execute a backup run.
	 *
	 * @param payload - Optional strategy override. `'auto'` (default) selects full on the
	 *   configured `fullBackupDay`, differential on all other days.
	 * @returns A {@link BackupResult} describing the outcome.
	 *
	 * @example
	 * await runBackupAction.execute({ strategy: 'full' })
	 */
	public async execute(payload?: RunBackupPayload): Promise<BackupResult> {
		const strategyType = payload?.strategy ?? 'auto';
		const engine = await app.container.make(BackupEngine, [strategyType, backupConfig.tempDir]);
		return engine.execute();
	}
}
