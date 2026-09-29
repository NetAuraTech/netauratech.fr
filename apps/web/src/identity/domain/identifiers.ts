import { Identifier } from '#core/domain/identifier';

/**
 * Identity-domain identifier types.
 *
 * Lucid models use numeric primary keys, so each identifier is a thin branded
 * wrapper around a number on the kernel {@link Identifier} base. They give
 * the pure domain objects a distinct, self-documenting identity type while
 * remaining trivially convertible back to the numeric key the persistence
 * layer uses (`.value`).
 */

/** Identifier of an identity {@link User}. */
export class UserIdentifier extends Identifier<number> {
	private constructor(value: number) {
		super(value);
	}

	/** Wraps a user primary key as a {@link UserIdentifier}. */
	static of(value: number): UserIdentifier {
		return new UserIdentifier(value);
	}
}

/** Identifier of an identity {@link Role}. */
export class RoleIdentifier extends Identifier<number> {
	private constructor(value: number) {
		super(value);
	}

	/** Wraps a role primary key as a {@link RoleIdentifier}. */
	static of(value: number): RoleIdentifier {
		return new RoleIdentifier(value);
	}
}

/** Identifier of an identity {@link Permission}. */
export class PermissionIdentifier extends Identifier<number> {
	private constructor(value: number) {
		super(value);
	}

	/** Wraps a permission primary key as a {@link PermissionIdentifier}. */
	static of(value: number): PermissionIdentifier {
		return new PermissionIdentifier(value);
	}
}
