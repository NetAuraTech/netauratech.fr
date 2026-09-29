import { Identifier } from '#core/domain/identifier';

/**
 * Auth-domain identifier types.
 *
 * Lucid models use numeric primary keys, so each identifier is a thin branded
 * wrapper around a number on the kernel {@link Identifier} base. It gives the
 * pure domain objects a distinct, self-documenting identity type while
 * remaining trivially convertible back to the numeric key the persistence
 * layer uses (`.value`).
 */

/** Identifier of an auth {@link Token}. */
export class TokenIdentifier extends Identifier<number> {
	private constructor(value: number) {
		super(value);
	}

	/** Wraps a token primary key as a {@link TokenIdentifier}. */
	static of(value: number): TokenIdentifier {
		return new TokenIdentifier(value);
	}
}
