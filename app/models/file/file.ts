import i18nManager from '@adonisjs/i18n/services/main'
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
   * Resolves the alt text for a given display intent using a single shared
   * priority chain, in order:
   *
   * 1. Keyed {@link FileAlt} for the requested locale.
   * 2. Keyed {@link FileAlt} for the default locale.
   * 3. Keyed {@link FileAlt} in any locale.
   * 4. The first alt entry (fallback for unkeyed intents).
   * 5. The inline override.
   *
   * The same chain serves CMS image blocks and manual front pages, so alt
   * resolution never drifts between the two rendering paths.
   *
   * @param locale - The current page locale
   * @param key - The named alt key (e.g. "hero"), or null when none is requested
   * @param override - Optional inline override, used only when no alt matches
   */
  resolveAlt(locale: string, key: string | null, override?: string | null): string {
    const alts = this.alts ?? []
    const defaultLocale = i18nManager.defaultLocale

    if (key) {
      const keyedLocale = alts.find((a) => a.locale === locale && a.key === key)
      if (keyedLocale) return keyedLocale.value

      const keyedDefault = alts.find((a) => a.locale === defaultLocale && a.key === key)
      if (keyedDefault) return keyedDefault.value

      const keyedAny = alts.find((a) => a.key === key)
      if (keyedAny) return keyedAny.value
    }

    const first = alts[0]
    if (first) return first.value

    return override ?? ''
  }
}
