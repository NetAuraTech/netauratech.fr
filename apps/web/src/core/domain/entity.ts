import type { Identifier } from '#core/domain/identifier';

/**
 * Base class for all domain entities.
 *
 * An entity is a pure domain object with an identity: its `props` must carry
 * an `id` identifier. An entity that has not been persisted yet (e.g. a log
 * entry going through the write pipeline) carries a `null` id until the
 * persistence layer assigns one. Equality between two entities is identity
 * equality, not field equality.
 */
export abstract class Entity<TProperties extends { id: Identifier<any> | null }> {
	readonly props: TProperties;

	protected constructor(props: TProperties) {
		this.props = props;
	}

	/** The identity of this entity, or `null` when it has not been persisted yet. */
	getIdentifier(): Identifier<any> | null {
		return this.props.id;
	}

	/** Whether `object` is the same entity (the same identity). */
	equals(object: Entity<TProperties>): boolean {
		if (this === object) {
			return true;
		}

		const a = this.getIdentifier();
		const b = object.getIdentifier();

		if (a === null || b === null) {
			return false;
		}

		return a.equals(b);
	}
}
