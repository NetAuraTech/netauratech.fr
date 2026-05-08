import { FileSchema } from '#database/schema'
import { beforeDelete, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/auth/user'
import FileAlt from '#models/file/file_alt'
import FileFolder from '#models/file/file_folder'
import type { StorageDisk } from '#types/file'

export default class File extends FileSchema {
  @column()
  declare disk: StorageDisk

  @belongsTo(() => FileFolder, { foreignKey: 'folderId' })
  declare folder: BelongsTo<typeof FileFolder>

  @hasMany(() => FileAlt, { foreignKey: 'fileId' })
  declare alts: HasMany<typeof FileAlt>

  /**
   * Lazy-loaded to avoid circular import — User model lives in a different domain.
   */
  @belongsTo(() => User, { foreignKey: 'uploadedBy' })
  declare uploader: BelongsTo<typeof User>

  // ─── Hooks ────────────────────────────────────────────────────────────────

  /**
   * Deletes the physical file from storage before the DB record is removed.
   * StorageService is resolved inline to avoid circular DI at module load time.
   */
  @beforeDelete()
  static async deletePhysicalFile(file: File) {
    const { StorageService } = await import('#services/file/storage_service')
    const storageService = new StorageService()
    await storageService.delete(file.path, file.disk)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Returns the public URL for this file on its storage disk.
   */
  async url(): Promise<string> {
    const { StorageService } = await import('#services/file/storage_service')
    const storageService = new StorageService()
    return storageService.url(this.path, this.disk)
  }

  /**
   * Resolves the alt text for a given locale and key.
   * Returns the override string directly if provided, otherwise looks up
   * the named alt from the loaded `alts` relation or falls back to empty string.
   *
   * @param locale - The current page locale
   * @param key - The named alt key (e.g. "hero")
   * @param override - Optional inline override bypassing the named system
   */
  resolveAlt(locale: string, key: string | null, override?: string | null): string {
    if (override) return override
    if (!key) return ''

    return this.alts?.find((a) => a.locale === locale && a.key === key)?.value ?? ''
  }
}
