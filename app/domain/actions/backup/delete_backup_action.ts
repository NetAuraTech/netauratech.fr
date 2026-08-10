import { inject } from '@adonisjs/core'
import drive from '@adonisjs/drive/services/main'
import backupConfig from '#config/backup'

interface DeleteBackupPayload {
  filename: string
}

/**
 * Delete a backup file from storage.
 */
@inject()
export class DeleteBackupAction {
  private getDisk() {
    return drive.use(backupConfig.storage.disk as Parameters<typeof drive.use>[0])
  }

  private buildPath(filename: string): string {
    return `${backupConfig.storage.prefix}/${filename}`
  }

  /**
   * Execute backup deletion.
   *
   * @param payload - The backup filename to delete.
   * @returns `true` when the file is successfully removed from storage.
   *
   * @example
   * await deleteBackupAction.execute({ filename: 'backup-full-2024-01-01-120000.sql.gz.enc' })
   */
  async execute(payload: DeleteBackupPayload): Promise<boolean> {
    await this.getDisk().delete(this.buildPath(payload.filename))
    return true
  }
}
