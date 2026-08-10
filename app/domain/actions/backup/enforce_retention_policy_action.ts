import { inject } from '@adonisjs/core'
import drive from '@adonisjs/drive/services/main'
import backupConfig from '#config/backup'
import { DateTime } from 'luxon'
import { LogService } from '#services/logging/log_service'
import { LogCategory } from '#types/logging'
import type { BackupMetadata } from './list_backups_action.js'

export interface RetentionPolicyResult {
  /** Filenames of backups that were successfully deleted. */
  deleted: string[]
  kept: number
}

interface EnforceRetentionPayload {
  daily?: number
  weekly?: number
  monthly?: number
  yearly?: number
}

/**
 * Enforce backup retention policy by deleting backups that fall outside the
 * configured retention windows.
 *
 * - **Daily** — keep all backups newer than `daily` days.
 * - **Weekly** — keep one backup per week (Sunday, weekday=7) for `weekly` weeks.
 * - **Monthly** — keep one backup per month (1st of month) for `monthly` months.
 * - **Yearly** — keep one backup per year (Jan 1st) for `yearly` years.
 */
@inject()
export class EnforceRetentionPolicyAction {
  constructor(protected logService: LogService) {}

  private getDisk() {
    return drive.use(backupConfig.storage.disk as Parameters<typeof drive.use>[0])
  }

  private buildPath(filename: string): string {
    return `${backupConfig.storage.prefix}/${filename}`
  }

  /**
   * Execute retention policy enforcement.
   *
   * @param payload - Optional override for the retention counts per period.
   *   Falls back to config defaults.
   * @returns A result object with the counts of deleted, kept, and errored backups.
   *
   * @example
   * const result = await enforceRetentionAction.execute({ daily: 7, weekly: 4 })
   */
  async execute(payload?: EnforceRetentionPayload): Promise<RetentionPolicyResult> {
    const retention = {
      daily: payload?.daily ?? backupConfig.retention.daily,
      weekly: payload?.weekly ?? backupConfig.retention.weekly,
      monthly: payload?.monthly ?? backupConfig.retention.monthly,
      yearly: payload?.yearly ?? backupConfig.retention.yearly,
    }

    this.logService.info({
      message: 'Starting backup cleanup',
      category: LogCategory.SYSTEM,
    })

    let deleted: string[] = []
    let kept = 0
    let errors = 0

    try {
      const disk = this.getDisk()
      const backups = await this.listBackups()
      const toDelete = this.getBackupsToDelete(backups, retention)

      for (const backup of toDelete) {
        try {
          await disk.delete(this.buildPath(backup.filename))
          deleted.push(backup.filename)
          this.logService.debug({
            message: 'Backup deleted',
            category: LogCategory.SYSTEM,
            metadata: { filename: backup.filename },
          })
        } catch (error) {
          errors++
          this.logService.error({
            message: 'Failed to delete backup',
            category: LogCategory.SYSTEM,
            error,
            metadata: { filename: backup.filename },
          })
        }
      }

      kept = backups.length - toDelete.length
    } catch (error) {
      this.logService.error({
        message: 'Failed to cleanup backups',
        category: LogCategory.SYSTEM,
        error,
      })
    }

    this.logService.info({
      message: 'Backup cleanup completed',
      category: LogCategory.SYSTEM,
      metadata: { deleted: deleted.length, kept, errors },
    })

    return { deleted, kept }
  }

  /**
   * Applies the retention windows and returns backups that should be deleted.
   *
   * Matches BackupService.getBackupsToDelete exactly:
   * - Daily: time-window check (newer than N days), not a count.
   * - Weekly: Sunday (weekday === 7 in Luxon ISO), within N weeks, capped at N.
   * - Monthly: 1st of month, within N months, capped at N.
   * - Yearly: Jan 1st, within N years, capped at N.
   */
  private getBackupsToDelete(
    backups: BackupMetadata[],
    retention: { daily: number; weekly: number; monthly: number; yearly: number }
  ): BackupMetadata[] {
    const now = DateTime.now()
    const toKeep = new Set<string>()

    const sorted = [...backups].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const dailyBackups = sorted.filter(
      (b) => DateTime.fromJSDate(b.createdAt) > now.minus({ days: retention.daily })
    )
    dailyBackups.forEach((b) => toKeep.add(b.filename))

    const weeklyBackups = sorted
      .filter((b) => {
        const date = DateTime.fromJSDate(b.createdAt)
        return date.weekday === 7 && date > now.minus({ weeks: retention.weekly })
      })
      .slice(0, retention.weekly)
    weeklyBackups.forEach((b) => toKeep.add(b.filename))

    const monthlyBackups = sorted
      .filter((b) => {
        const date = DateTime.fromJSDate(b.createdAt)
        return date.day === 1 && date > now.minus({ months: retention.monthly })
      })
      .slice(0, retention.monthly)
    monthlyBackups.forEach((b) => toKeep.add(b.filename))

    const yearlyBackups = sorted
      .filter((b) => {
        const date = DateTime.fromJSDate(b.createdAt)
        return date.month === 1 && date.day === 1 && date > now.minus({ years: retention.yearly })
      })
      .slice(0, retention.yearly)
    yearlyBackups.forEach((b) => toKeep.add(b.filename))

    return sorted.filter((b) => !toKeep.has(b.filename))
  }

  private parseFilenameDate(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number)
    const hour = Number.parseInt(time.slice(0, 2))
    const minute = Number.parseInt(time.slice(2, 4))
    const second = Number.parseInt(time.slice(4, 6))
    return new Date(year, month - 1, day, hour, minute, second)
  }

  private async listBackups(): Promise<BackupMetadata[]> {
    try {
      const disk = this.getDisk()
      const prefix = `${backupConfig.storage.prefix}/`
      const { objects } = await disk.listAll(prefix)
      const backups: BackupMetadata[] = []

      for (const object of objects) {
        if (object.isDirectory) continue

        const filename = object.key.replace(prefix, '')
        const match = filename.match(/backup-(full|differential)-(\d{4}-\d{2}-\d{2})-(\d{6})/)
        if (!match) continue

        const meta = await disk.getMetaData(object.key)

        backups.push({
          filename,
          type: match[1] as 'full' | 'differential',
          size: meta.contentLength || 0,
          createdAt: meta.lastModified || this.parseFilenameDate(match[2], match[3]),
          path: object.key,
        })
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch {
      return []
    }
  }
}
