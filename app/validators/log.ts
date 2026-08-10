import vine from '@vinejs/vine'
import { LogCategory, LogLevel } from '#types/logging'

const levels = Object.values(LogLevel)
const categories = Object.values(LogCategory)

export const listLogsValidator = vine.create({
  level: vine.enum(levels).optional(),
  category: vine.enum(categories).optional(),
  search: vine.string().trim().maxLength(100).optional(),
  actorId: vine.number().positive().optional(),
  from: vine.date({ formats: ['iso8601'] }).optional(),
  to: vine.date({ formats: ['iso8601'] }).optional(),
})
