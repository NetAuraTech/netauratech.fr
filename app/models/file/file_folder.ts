import { FileFolderSchema } from '#database/schema'
import { belongsTo, hasMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import File from '#models/file/file'

export default class FileFolder extends FileFolderSchema {
  @belongsTo(() => FileFolder, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof FileFolder>

  @hasMany(() => FileFolder, { foreignKey: 'parentId' })
  declare children: HasMany<typeof FileFolder>

  @hasMany(() => File, { foreignKey: 'folderId' })
  declare files: HasMany<typeof File>

  static roots = scope((query) => {
    query.whereNull('parent_id')
  })
}
