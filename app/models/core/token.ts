import { TokenSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import User from '#models/auth/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Token extends TokenSchema {
  @belongsTo(() => User)
  declare public user: BelongsTo<typeof User>
}
