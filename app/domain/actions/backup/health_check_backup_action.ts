import { inject } from '@adonisjs/core'
import drive from '@adonisjs/drive/services/main'
import backupConfig from '#config/backup'
import { LogService } from '#services/logging/log_service'
import { LogCategory } from '#types/logging'
import type { BackupMetadata } from './list_backups_action.js'

export interface HealthCheckResult {
  healthy: boolean
  issues: string[]
  /** Most recent backup metadata, or `null` if no backups exist. */
  lastBackup: BackupMetadata | null
  /** Age of the most recent backup in hours. `Infinity` when no backups exist. */
  lastBackupAgeHours: number
  /** Total number of backup archives found in storage. */
  totalBackups: number
  /** Sum of all backup archive sizes in bytes. */
  totalSizeBytes: number
  storage: { disk: string; available: boolean }
}

interface HealthCheckPayload {
  maxAgeDays?: number
}

/**
 * Run a health check on the backup storage, reporting age, availability, and issues.
 */
@inject()
export class HealthCheckBackupAction {
  constructor(protected logService: LogService) {}

  private getDisk() {
    return drive.use(backupConfig.storage.disk as Parameters<typeof drive.use>[0])
  }

  /**
   * Execute the health check.
   *
   * Checks performed:
   * - Storage availability (Drive ping via `listAll`).
   * - Age of the most recent backup against `maxBackupAge` (in **hours**).
   *
   * @param payload - Optional override for the max age threshold in days.
   *   Falls back to `backupConfig.health.maxBackupAge` (hours).
   * @returns A {@link HealthCheckResult} with a `healthy` flag, `issues` array,
   *   `lastBackup` metadata, and storage availability status.
   *
   * @example
   * const { healthy, issues } = await healthCheckAction.execute()
   */
  async execute(payload?: HealthCheckPayload): Promise<HealthCheckResult> {
    const issues: string[] = []
    let available = false

    // Ping the disk first, matching BackupService.healthCheck
    try {
      const disk = this.getDisk()
      await disk.listAll(`${backupConfig.storage.prefix}/`)
      available = true
    } catch {
      issues.push(`Storage disk "${backupConfig.storage.disk}" is not available`)
    }

    const backups = await this.listBackups()
    let lastBackup: BackupMetadata | null = null
    let lastBackupAgeHours = Infinity
    const totalBackups = backups.length
    const totalSizeBytes = backups.reduce((sum, b) => sum + b.size, 0)

    if (backups.length > 0) {
      lastBackup = backups[0]

      // maxBackupAge is in hours in the service; payload override is converted accordingly
      const maxAgeHours =
        payload?.maxAgeDays !== undefined
          ? payload.maxAgeDays * 24
          : backupConfig.health.maxBackupAge

      lastBackupAgeHours = (Date.now() - lastBackup.createdAt.getTime()) / (1000 * 60 * 60)

      if (lastBackupAgeHours > maxAgeHours) {
        issues.push(
          `Last backup is too old: ${lastBackupAgeHours.toFixed(1)} hours (max: ${maxAgeHours} hours)`
        )
      }
    } else {
      issues.push('No backups found')
    }

    const healthy = issues.length === 0

    if (!healthy && backupConfig.notifications.onHealthCheckFailure) {
      this.logService.error({
        message: 'Backup health check failed',
        category: LogCategory.SYSTEM,
        metadata: { issues },
      })
    }

    return {
      healthy,
      issues,
      lastBackup,
      lastBackupAgeHours,
      totalBackups,
      totalSizeBytes,
      storage: { disk: backupConfig.storage.disk, available },
    }
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
