import factory from '@adonisjs/lucid/factories'
import LogEntry from '#models/core/log_entry'
import { LogCategory, LogLevel } from '#types/logging'

export const LogEntryFactory = factory
  .define(LogEntry, async ({ faker }) => {
    return {
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: faker.lorem.sentence(),
      actorId: null,
      actorEmail: null,
      ip: null,
      userAgent: null,
      requestId: null,
      context: null,
      error: null,
    }
  })
  .build()
