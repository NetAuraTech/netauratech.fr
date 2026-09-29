import { DateTime } from 'luxon';
import { BackupMetadata } from '#backup/domain/backup';
import { BackupPipeline } from '#backup/services/backup_pipeline';
import backupConfig from '#config/backup';
import { type LogService } from '#log/services/log_service';
import type { BackupResult, BackupContext, BackupStrategy } from '#backup/types/backup';

/**
 * BackupEngine — Orchestrates backup execution by resolving the strategy
 * type (explicit or `auto` off the configured schedule), building the
 * context, and delegating to the shared {@link BackupPipeline}: full and
 * differential backups both run end to end through it.
 *
 * Non-DI class: imported and instantiated directly, no @inject().
 */
export class BackupEngine {
	private readonly context: BackupContext;

	constructor(
		private readonly strategyType: BackupStrategy,
		private readonly tempDir: string,
		private readonly logService: LogService,
	) {
		const resolvedType = this.resolveStrategy();
		this.context = {
			tempDir: this.tempDir,
			filename: BackupMetadata.generateFilename(resolvedType),
			strategyType: resolvedType,
		};
	}

	/**
	 * Execute the backup through the shared pipeline: the full or the
	 * differential entry point, depending on the resolved strategy type.
	 */
	async execute(): Promise<BackupResult> {
		const pipeline = new BackupPipeline(this.context, this.logService);
		return this.context.strategyType === 'full' ? pipeline.executeFullBackup() : pipeline.executeDifferentialBackup();
	}

	/**
	 * Resolve the actual strategy type. If 'auto', use the configured full backup day.
	 * Config uses JS getDay() semantics (0=Sunday), Luxon uses weekday (1=Sunday).
	 */
	private resolveStrategy(): 'full' | 'differential' {
		if (this.strategyType !== 'auto') return this.strategyType;

		const now = DateTime.now();
		// Convert Luxon weekday (1=Sun) to JS getDay () (0=Sun) for comparison with config
		const jsDayOfWeek = now.weekday === 7 ? 0 : now.weekday;
		return jsDayOfWeek === backupConfig.schedule.fullBackupDay ? 'full' : 'differential';
	}
}
