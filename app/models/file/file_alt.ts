import { FileAltSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import File from '#models/file/file'

export default class FileAlt extends FileAltSchema {
  @belongsTo(() => File, { foreignKey: 'fileId' })
  declare file: BelongsTo<typeof File>
}
