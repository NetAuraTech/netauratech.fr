import type { PaginationFilters } from '#types/pagination';
import type { DateTime } from 'luxon';

export enum LogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	FATAL = 'fatal',
}

export enum LogCategory {
	AUTH = 'auth',
	API = 'api',
	DATABASE = 'database',
	SECURITY = 'security',
	PERFORMANCE = 'performance',
	BUSINESS = 'business',
	SYSTEM = 'system',
}

export interface LogContext {
	userId?: number;
	userEmail?: string;
	ip?: string;
	userAgent?: string;
	requestId?: string;
	method?: string;
	url?: string;
	statusCode?: number;
	duration?: number;
	[key: string]: any;
}

export interface LogEntry {
	message: string;
	level?: LogLevel;
	category?: LogCategory;
	context?: LogContext;
	error?: Error;
	metadata?: Record<string, any>;
	/**
	 * Structured actor identity persisted as first-class columns on the
	 * `log_entries` table. Explicit top-level values take precedence over the
	 * legacy `context.userId` / `context.userEmail` / `context.ip` /
	 * `context.userAgent` / `context.requestId` keys during persistence.
	 */
	actorId?: number | null;
	actorEmail?: string | null;
	ip?: string | null;
	userAgent?: string | null;
	requestId?: string | null;
}

/**
 * Persistence input for a single row of the `log_entries` table.
 *
 * Produced by the logging pipeline after normalising a {@link LogEntry}
 * (defaults applied, identity fields resolved, error serialised).
 */
export interface CreateLogEntryInput {
	level: LogLevel;
	category: LogCategory;
	message: string;
	actorId?: number | null;
	actorEmail?: string | null;
	ip?: string | null;
	userAgent?: string | null;
	requestId?: string | null;
	context?: Record<string, any> | null;
	error?: { name: string; message: string; stack?: string } | null;
}

/**
 * Filters accepted by the admin log viewer and by the repository's
 * paginated listing. All filters are optional and combine with AND.
 */
export interface LogEntryListFilters extends PaginationFilters {
	/** Exact log level match (`info`, `warn`, `error`, `fatal`). */
	level?: LogLevel;
	/** Exact category match (`system`, `security`, `business`). */
	category?: LogCategory;
	/** Case-insensitive substring match on the message. */
	search?: string;
	/** Restrict to entries performed by a specific user. */
	actorId?: number;
	/** Only entries created at or after this date. */
	from?: DateTime;
	/** Only entries created at or before this date. */
	to?: DateTime;
}
