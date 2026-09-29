import { ValueObject } from '#core/domain/value_object';

/**
 * Base class for all domain identifiers.
 *
 * A branded wrapper around an identity value, generic over the value type.
 * Every domain wraps its Lucid numeric primary key in its own subclass
 * (one per aggregate), so the pure domain objects carry a distinct,
 * self-documenting identity type while remaining trivially convertible back
 * to the numeric key the persistence layer uses (`.value`).
 */
export class Identifier<T> extends ValueObject<{ value: T }> {
	constructor(value: T) {
		super({ value });
	}

	/** The raw identity value this identifier wraps. */
	get value(): T {
		return this.props.value;
	}

	/** The string form of the wrapped value. */
	toString(): string {
		return String(this.props.value);
	}

	/**
	 * Whether this identifier points at the same identity as `other` — the
	 * same domain class and the same wrapped value.
	 */
	equals(other: Identifier<T>): boolean {
		return other.constructor === this.constructor && this.props.value === other.props.value;
	}
}
