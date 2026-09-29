import { Entity } from '#core/domain/entity';
import { LogEntryIdentifier } from '#log/domain/identifiers';
import { LogCategory, LogLevel } from '#log/types/logging';
import type { CreateLogEntryInput, LogContext } from '#log/types/logging';

/**
 * Pure domain object for a log entry.
 *
 * Encapsulates the business rules of the write-through persistence — most
 * importantly the actor-identity resolution (explicit top-level fields take
 * precedence over the legacy `context` keys) and the error serialisation — so
 * the persistence pipeline never re-implements them. The Lucid `LogEntry`
 * model is the persistence representation; build one from a raw log request
 * with {@link LogEntry.fromRequest}, hand it to the repository with
 * {@link LogEntry.toRecord}, and hydrate a persisted one with
 * {@link LogEntry.fromModel}. An entry not persisted yet carries a `null`
 * id until the persistence layer assigns one.
 */
export class LogEntry extends Entity<{
	id: LogEntryIdentifier | null;
	level: LogLevel;
	category: LogCategory;
	message: string;
	actorId: number | null;
	actorEmail: string | null;
	ip: string | null;
	userAgent: string | null;
	requestId: string | null;
	context: Record<string, any>;
	error: { name: string; message: string; stack?: string } | null;
	createdAt: Date | null;
}> {
	private constructor(
		readonly id: LogEntryIdentifier | null,
		readonly level: LogLevel,
		readonly category: LogCategory,
		readonly message: string,
		readonly actorId: number | null,
		readonly actorEmail: string | null,
		readonly ip: string | null,
		readonly userAgent: string | null,
		readonly requestId: string | null,
		readonly context: Record<string, any>,
		readonly error: { name: string; message: string; stack?: string } | null,
		readonly createdAt: Date | null = null,
	) {
		super({ id, level, category, message, actorId, actorEmail, ip, userAgent, requestId, context, error, createdAt });
	}

	/**
	 * Normalise a raw log request into a persistable entry.
	 *
	 * Explicit top-level identity fields take precedence over the legacy
	 * `context` keys (`userId`, `userEmail`, `ip`, `userAgent`, `requestId`);
	 * `metadata` is merged into `context`; the `Error` instance is serialised
	 * into a plain block. The entry is not persisted yet, so its id is
	 * `null`.
	 *
	 * @param entry - The raw log request with resolved level and category.
	 */
	static fromRequest(entry: {
		message: string;
		level: LogLevel;
		category: LogCategory;
		context?: LogContext;
		error?: Error;
		metadata?: Record<string, any>;
		actorId?: number | null;
		actorEmail?: string | null;
		ip?: string | null;
		userAgent?: string | null;
		requestId?: string | null;
	}): LogEntry {
		const context = entry.context ?? {};

		return new LogEntry(
			null,
			entry.level,
			entry.category,
			entry.message,
			entry.actorId ?? context.userId ?? null,
			entry.actorEmail ?? context.userEmail ?? null,
			entry.ip ?? context.ip ?? null,
			entry.userAgent ?? context.userAgent ?? null,
			entry.requestId ?? context.requestId ?? null,
			{ ...context, ...(entry.metadata ?? {}) },
			entry.error ? { name: entry.error.name, message: entry.error.message, stack: entry.error.stack } : null,
		);
	}

	/**
	 * Hydrate a domain log entry from its Lucid model representation.
	 *
	 * @param model - The persisted log entry row.
	 */
	static fromModel(model: {
		id: number;
		level: LogLevel;
		category: LogCategory;
		message: string;
		actorId: number | null;
		actorEmail: string | null;
		ip: string | null;
		userAgent: string | null;
		requestId: string | null;
		context: Record<string, any> | null;
		error: { name: string; message: string; stack?: string } | null;
		createdAt?: Date | null;
	}): LogEntry {
		return new LogEntry(
			LogEntryIdentifier.of(model.id),
			model.level,
			model.category,
			model.message,
			model.actorId,
			model.actorEmail,
			model.ip,
			model.userAgent,
			model.requestId,
			model.context ?? {},
			model.error,
			model.createdAt ?? null,
		);
	}

	/**
	 * The persistence shape of the entry — the exact row of the `log_entries`
	 * table, ready for `LogEntryRepository.createRecord`.
	 */
	toRecord(): CreateLogEntryInput {
		return {
			level: this.level,
			category: this.category,
			message: this.message,
			actorId: this.actorId,
			actorEmail: this.actorEmail,
			ip: this.ip,
			userAgent: this.userAgent,
			requestId: this.requestId,
			context: this.context,
			error: this.error,
		};
	}
}
