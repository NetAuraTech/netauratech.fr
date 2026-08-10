import app from '@adonisjs/core/services/app'
import { inject } from '@adonisjs/core'
import { BackupEngine } from '#services/backup/backup_engine'
import type { BackupResult } from '#services/backup/backup_strategy'

export interface RunBackupPayload {
  strategy?: 'full' | 'differential' | 'auto'
}

/**
 * RunBackupAction — Thin orchestrator action for backup execution.
 *
 * Delegates all logic to BackupEngine which selects the appropriate
 * strategy and runs the full pipeline (dump → compress → encrypt →
 * manifest → upload).
 */
@inject()
export default class RunBackupAction {
  private readonly tempDir = 'storage/temp/backups'

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
    const strategyType = payload?.strategy ?? 'auto'
    const engine = await app.container.make(BackupEngine, [strategyType, this.tempDir])
    return engine.execute()
  }
}
