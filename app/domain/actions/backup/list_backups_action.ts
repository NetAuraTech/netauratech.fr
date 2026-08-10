import { inject } from '@adonisjs/core'
import drive from '@adonisjs/drive/services/main'
import backupConfig from '#config/backup'

export interface BackupMetadata {
  filename: string
  type: 'full' | 'differential'
  size: number
  createdAt: Date
  path: string
}

interface ListBackupsPayload {
  type?: 'full' | 'differential'
}

/**
 * List all backup files from storage, optionally filtered by type.
 */
@inject()
export class ListBackupsAction {
  private getDisk() {
    return drive.use(backupConfig.storage.disk as Parameters<typeof drive.use>[0])
  }

  /**
   * Execute backup listing.
   *
   * @param payload - Optional filter to return only full or differential backups.
   * @returns An array of {@link BackupMetadata} sorted newest first, or an empty array if no backups exist.
   *
   * @example
   * const backups = await listBackupsAction.execute({ type: 'full' })
   */
  async execute(payload?: ListBackupsPayload): Promise<BackupMetadata[]> {
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

      const sorted = backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      if (payload?.type) {
        return sorted.filter((b) => b.type === payload.type)
      }

      return sorted
    } catch {
      return []
    }
  }

  /**
   * Reconstructs a `Date` from the date and time fragments in a backup filename.
   *
   * @param date - Date segment in `YYYY-MM-DD` format.
   * @param time - Time segment as a 6-digit string `HHmmss`.
   */
  private parseFilenameDate(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number)
    const hour = Number.parseInt(time.slice(0, 2))
    const minute = Number.parseInt(time.slice(2, 4))
    const second = Number.parseInt(time.slice(4, 6))
    return new Date(year, month - 1, day, hour, minute, second)
  }
}
