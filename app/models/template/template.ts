import { TemplateSchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/auth/user'
import File from '#models/file/file'
import type { BlockType, PageContent } from '#types/page'
import type { TemplateType } from '#types/template'

export default class Template extends TemplateSchema {
  @column()
  declare type: TemplateType

  @column()
  declare blockType: BlockType | null

  declare content: PageContent

  @belongsTo(() => File, { foreignKey: 'thumbnailId' })
  declare thumbnail: BelongsTo<typeof File>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare author: BelongsTo<typeof User>
}
