import { LogEntrySchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/auth/user'
import type { LogCategory, LogLevel } from '#types/logging'

export default class LogEntry extends LogEntrySchema {
  @column()
  declare level: LogLevel

  @column()
  declare category: LogCategory

  @column()
  declare context: Record<string, any> | null

  @column()
  declare error: { name: string; message: string; stack?: string } | null

  @belongsTo(() => User, { foreignKey: 'actorId' })
  declare actor: BelongsTo<typeof User>
}
