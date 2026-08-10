import logger from '@adonisjs/core/services/logger'
import type { HttpContext } from '@adonisjs/core/http'
import {
  LogCategory,
  type CreateLogEntryInput,
  type LogContext,
  type LogEntry,
  LogLevel,
} from '#types/logging'
import { LogEntryRepository } from '#repositories/logging/log_entry_repository'
import loggingConfig from '#config/logging'
import { inject } from '@adonisjs/core'

/**
 * Numeric severity order used to compare levels against the configured
 * persistence threshold. Array index = severity rank.
 */
const LEVEL_ORDER: LogLevel[] = [
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARN,
  LogLevel.ERROR,
  LogLevel.FATAL,
]

/**
 * Categories whose entries are always persisted, regardless of level —
 * they carry security-relevant or audit-trail meaning.
 */
const ALWAYS_PERSISTED_CATEGORIES: LogCategory[] = [LogCategory.SECURITY, LogCategory.BUSINESS]

/**
 * Noisy categories whose `debug` entries are never persisted when
 * `persistence.excludeDebugNoise` is enabled.
 */
const DEBUG_NOISE_CATEGORIES: LogCategory[] = [
  LogCategory.API,
  LogCategory.DATABASE,
  LogCategory.PERFORMANCE,
]

/**
 * Centralised logging service wrapping AdonisJS's built-in logger.
 *
 * Provides typed convenience methods for each log level as well as
 * domain-specific helpers (auth, security, API, database, performance,
 * business) that automatically attach the correct {@link LogCategory}
 * and structured context to every entry.
 *
 * In addition to the in-memory pino output, every entry flowing through
 * {@link LogService.log} is write-through persisted to the `log_entries`
 * table when it passes the persistence gate ({@link LogService.shouldPersist}).
 * Persistence is fire-and-forget — failures are swallowed and reported to
 * the pino logger so a database outage never breaks a request.
 */
@inject()
export class LogService {
  /**
   * Instantiated directly rather than injected — this service is resolved
   * too early in middleware/lifecycle paths for container injection.
   */
  private logEntryRepository = new LogEntryRepository()

  /**
   * Emits a log entry at the `DEBUG` level.
   *
   * Use for verbose, development-time information that should not appear
   * in production logs under normal circumstances.
   *
   * @param entry - The log entry (level will be overridden to `DEBUG`).
   *
   * @example
   * logService.debug({ message: 'Cache miss', context: { key } })
   */
  debug(entry: LogEntry): void {
    this.log({ ...entry, level: LogLevel.DEBUG })
  }

  /**
   * Emits a log entry at the `INFO` level.
   *
   * Use for routine operational events that confirm the system is
   * working as expected.
   *
   * @param entry - The log entry (level will be overridden to `INFO`).
   *
   * @example
   * logService.info({ message: 'Server started', context: { port: 3000 } })
   */
  info(entry: LogEntry): void {
    this.log({ ...entry, level: LogLevel.INFO })
  }

  /**
   * Emits a log entry at the `WARN` level.
   *
   * Use for recoverable anomalies or conditions that may require
   * attention but do not interrupt the current operation.
   *
   * @param entry - The log entry (level will be overridden to `WARN`).
   *
   * @example
   * logService.warn({ message: 'Slow query detected', context: { duration } })
   */
  warn(entry: LogEntry): void {
    this.log({ ...entry, level: LogLevel.WARN })
  }

  /**
   * Emits a log entry at the `ERROR` level.
   *
   * Use for failures that affect the current operation but allow the
   * application to keep running.
   *
   * @param entry - The log entry (level will be overridden to `ERROR`).
   *
   * @example
   * logService.error({ message: 'Payment failed', error, context: { userId } })
   */
  error(entry: LogEntry): void {
    this.log({ ...entry, level: LogLevel.ERROR })
  }

  /**
   * Emits a log entry at the `FATAL` level.
   *
   * Use for unrecoverable errors that require immediate intervention
   * and typically cause the process to terminate.
   *
   * @param entry - The log entry (level will be overridden to `FATAL`).
   *
   * @example
   * logService.fatal({ message: 'Database connection lost', error })
   */
  fatal(entry: LogEntry): void {
    this.log({ ...entry, level: LogLevel.FATAL })
  }

  /**
   * Core log dispatcher — normalises a {@link LogEntry} and forwards it
   * to the underlying AdonisJS logger at the appropriate level.
   *
   * All convenience methods (`debug`, `info`, `warn`, `error`, `fatal`) and
   * domain helpers ultimately call this method. The resulting log object
   * merges `context` and `metadata` fields at the root level alongside a
   * normalised `error` block when an `Error` instance is provided.
   *
   * @param entry - The fully or partially populated log entry to emit.
   *
   * @example
   * logService.log({
   *   message: 'Custom event',
   *   level: LogLevel.INFO,
   *   category: LogCategory.SYSTEM,
   *   context: { requestId },
   * })
   */
  log(entry: LogEntry): void {
    const {
      message,
      level = LogLevel.INFO,
      category = LogCategory.SYSTEM,
      context = {},
      error,
      metadata = {},
    } = entry

    const logData: Record<string, any> = {
      message,
      category,
      timestamp: new Date().toISOString(),
      ...context,
      ...metadata,
    }

    if (error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    switch (level) {
      case LogLevel.DEBUG:
        logger.debug(logData, message)
        break
      case LogLevel.INFO:
        logger.info(logData, message)
        break
      case LogLevel.WARN:
        logger.warn(logData, message)
        break
      case LogLevel.ERROR:
        logger.error(logData, message)
        break
      case LogLevel.FATAL:
        logger.fatal(logData, message)
        break
    }

    // Fire-and-forget write-through — never awaited, failures are swallowed
    // inside persistEntry so a database outage never breaks a request.
    void this.persistEntry(entry, level, category)
  }

  /**
   * Decides whether a log entry should be persisted to the `log_entries`
   * table, based on the `logging.persistence` configuration.
   *
   * Rules:
   * - Entries in security-relevant categories (`security`, `business`) are
   *   always persisted, regardless of level.
   * - When `excludeDebugNoise` is enabled, `debug` entries from noisy
   *   categories (`api`, `database`, `performance`) are never persisted.
   * - Otherwise, entries are persisted when their level is at or above the
   *   configured `minLevel`.
   *
   * @param level - The resolved log level of the entry.
   * @param category - The resolved category of the entry.
   * @returns `true` when the entry should be written to the database.
   */
  private shouldPersist(level: LogLevel, category: LogCategory): boolean {
    if (ALWAYS_PERSISTED_CATEGORIES.includes(category)) {
      return true
    }

    const { minLevel, excludeDebugNoise } = loggingConfig.persistence

    if (
      excludeDebugNoise &&
      level === LogLevel.DEBUG &&
      DEBUG_NOISE_CATEGORIES.includes(category)
    ) {
      return false
    }

    return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(minLevel)
  }

  /**
   * Persists a log entry to the `log_entries` table.
   *
   * Fire-and-forget: this method never throws. Any database failure is
   * caught and reported to the in-memory pino logger so that logging never
   * crashes the calling request. Explicit identity fields on the entry take
   * precedence over the legacy `context` keys (`userId`, `userEmail`, …).
   *
   * @param entry - The original log entry as passed to {@link LogService.log}.
   * @param level - The resolved log level (after convenience-method overrides).
   * @param category - The resolved category (defaults to `system`).
   */
  private async persistEntry(
    entry: LogEntry,
    level: LogLevel,
    category: LogCategory
  ): Promise<void> {
    if (!this.shouldPersist(level, category)) return

    const context = entry.context ?? {}

    const input: CreateLogEntryInput = {
      level,
      category,
      message: entry.message,
      actorId: entry.actorId ?? context.userId ?? null,
      actorEmail: entry.actorEmail ?? context.userEmail ?? null,
      ip: entry.ip ?? context.ip ?? null,
      userAgent: entry.userAgent ?? context.userAgent ?? null,
      requestId: entry.requestId ?? context.requestId ?? null,
      context: { ...context, ...(entry.metadata ?? {}) },
      error: entry.error
        ? {
            name: entry.error.name,
            message: entry.error.message,
            stack: entry.error.stack,
          }
        : null,
    }

    try {
      await this.logEntryRepository.createRecord(input)
    } catch (dbError) {
      logger.warn(
        { err: dbError, originalMessage: entry.message },
        'Failed to persist log entry to database'
      )
    }
  }

  /**
   * Logs an authentication event at the `INFO` level under the
   * {@link LogCategory.AUTH} category.
   *
   * @param action - A dot-notation identifier for the auth action
   *   (e.g. `'login.success'`, `'social.linked'`).
   * @param context - Structured context to attach to the log entry
   *   (e.g. `{ userId, userEmail }`).
   *
   * @example
   * logService.logAuth('login.success', { userId: user.id, userEmail: user.email })
   */
  logAuth(action: string, context: LogContext): void {
    this.info({
      message: `Authentication: ${action}`,
      category: LogCategory.AUTH,
      context,
    })
  }

  /**
   * Logs a security-related event under the {@link LogCategory.SECURITY}
   * category, defaulting to the `WARN` level.
   *
   * Use this for suspicious activity, access violations, or any event
   * that warrants a security audit trail.
   *
   * @param message - A human-readable description of the security event.
   * @param context - Structured context to attach (e.g. `{ userId, ip }`).
   * @param level - Override the log level (default: `LogLevel.WARN`).
   *
   * @example
   * logService.logSecurity('Brute-force attempt detected', { ip }, LogLevel.ERROR)
   */
  logSecurity(message: string, context: LogContext, level: LogLevel = LogLevel.WARN): void {
    this.log({
      message,
      level,
      category: LogCategory.SECURITY,
      context,
    })
  }

  /**
   * Logs an incoming HTTP request under the {@link LogCategory.API} category.
   *
   * Captures method, URL, IP, user agent, authenticated user, response status,
   * and optional request duration. Intended to be called from a middleware
   * after the response has been sent.
   *
   * @param ctx - The current AdonisJS HTTP context.
   * @param duration - Optional request duration in milliseconds.
   *
   * @example
   * logService.logApiRequest(ctx, 120)
   */
  logApiRequest(ctx: HttpContext, duration?: number): void {
    this.info({
      message: 'API Request',
      category: LogCategory.API,
      context: {
        method: ctx.request.method(),
        url: ctx.request.url(),
        ip: ctx.request.ip(),
        userAgent: ctx.request.header('user-agent'),
        userId: ctx.auth?.user?.id,
        userEmail: ctx.auth?.user?.email,
        statusCode: ctx.response.getStatus(),
        duration,
      },
    })
  }

  /**
   * Logs a database query and its execution time under the
   * {@link LogCategory.DATABASE} category.
   *
   * Queries exceeding **1 000 ms** are automatically elevated to `WARN`
   * level; all others are logged at `DEBUG`. The query string is truncated
   * to 200 characters to prevent log bloat.
   *
   * @param query - The raw SQL query string.
   * @param duration - Query execution time in milliseconds.
   * @param context - Optional additional context (e.g. model name, operation).
   *
   * @example
   * logService.logQuery('SELECT * FROM users WHERE id = ?', 42, { model: 'User' })
   */
  logQuery(query: string, duration: number, context?: LogContext): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG

    this.log({
      message: 'Database Query',
      level,
      category: LogCategory.DATABASE,
      context: {
        ...context,
        duration,
      },
      metadata: {
        query: query.substring(0, 200),
      },
    })
  }

  /**
   * Logs the duration of an arbitrary operation under the
   * {@link LogCategory.PERFORMANCE} category.
   *
   * Operations exceeding **5 000 ms** are automatically elevated to `WARN`
   * level; all others are logged at `INFO`.
   *
   * @param operation - A short identifier for the measured operation
   *   (e.g. `'image.resize'`, `'report.generate'`).
   * @param duration - Operation duration in milliseconds.
   * @param context - Optional additional context to attach to the entry.
   *
   * @example
   * logService.logPerformance('pdf.export', 3200, { userId })
   */
  logPerformance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO

    this.log({
      message: `Performance: ${operation}`,
      level,
      category: LogCategory.PERFORMANCE,
      context: {
        ...context,
        duration,
        operation,
      },
    })
  }

  /**
   * Logs a domain business event at the `INFO` level under the
   * {@link LogCategory.BUSINESS} category.
   *
   * Use this to record meaningful domain actions that are useful for
   * analytics or auditing (e.g. order placed, subscription upgraded).
   *
   * @param event - A dot-notation identifier for the business event
   *   (e.g. `'order.placed'`, `'subscription.upgraded'`).
   * @param context - Structured context to attach (e.g. `{ userId, planId }`).
   * @param metadata - Optional arbitrary metadata for additional detail.
   *
   * @example
   * logService.logBusiness('subscription.upgraded', { userId }, { plan: 'pro' })
   */
  logBusiness(event: string, context: LogContext, metadata?: Record<string, any>): void {
    this.info({
      message: `Business Event: ${event}`,
      category: LogCategory.BUSINESS,
      context,
      metadata,
    })
  }

  /**
   * Extracts a standardised {@link LogContext} from an AdonisJS HTTP context.
   *
   * Useful for building a base context object at the start of a controller
   * action and passing it to subsequent log calls throughout the request
   * lifecycle.
   *
   * @param ctx - The current AdonisJS HTTP context.
   * @returns A {@link LogContext} populated with user, IP, user agent,
   *   HTTP method, and URL.
   *
   * @example
   * const context = logService.extractContext(ctx)
   * logService.logBusiness('order.placed', context, { orderId })
   */
  extractContext(ctx: HttpContext): LogContext {
    return {
      userId: ctx.auth?.user?.id,
      userEmail: ctx.auth?.user?.email,
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
      method: ctx.request.method(),
      url: ctx.request.url(),
    }
  }
}
