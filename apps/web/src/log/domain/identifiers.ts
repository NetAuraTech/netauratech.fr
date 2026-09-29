import { Identifier } from '#core/domain/identifier';

/**
 * Log-domain identifier types.
 *
 * Lucid models use numeric primary keys, so the identifier is a thin branded
 * wrapper around a number on the kernel {@link Identifier} base. It gives the
 * pure domain objects a distinct, self-documenting identity type while
 * remaining trivially convertible back to the numeric key the persistence
 * layer and transformers use (`.value`).
 */

/** Identifier of a {@link LogEntry}. */
export class LogEntryIdentifier extends Identifier<number> {
	private constructor(value: number) {
		super(value);
	}

	/** Wraps a log entry primary key as a {@link LogEntryIdentifier}. */
	static of(value: number): LogEntryIdentifier {
		return new LogEntryIdentifier(value);
	}
}
