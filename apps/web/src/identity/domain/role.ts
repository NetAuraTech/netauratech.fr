import { Entity } from '#core/domain/entity';
import { RoleIdentifier } from '#identity/domain/identifiers';
import type { Permission } from '#identity/domain/permission';
import type { User } from '#identity/domain/user';

/**
 * Pure domain object for an identity {@link Role}.
 *
 * Encapsulates the business invariants of a role outside the persistence
 * layer. The Lucid `Role` model is the persistence representation; this
 * object carries the rules that decide whether a role may be modified,
 * deleted, or grants a specific permission. Hydrate one from a model with
 * {@link Role.fromModel}.
 */
export class Role extends Entity<{
	id: RoleIdentifier;
	slug: string;
	name: string;
	description: string | null;
	isSystem: boolean;
	permissions: readonly Permission[] | null;
	users: readonly User[] | null;
	usersCount: number | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}> {
	private constructor(
		readonly id: RoleIdentifier,
		readonly slug: string,
		readonly name: string,
		readonly description: string | null,
		readonly isSystem: boolean,
		readonly permissions: readonly Permission[] | null,
		readonly users: readonly User[] | null,
		readonly usersCount: number | null,
		readonly createdAt: Date | null,
		readonly updatedAt: Date | null,
	) {
		super({ id, slug, name, description, isSystem, permissions, users, usersCount, createdAt, updatedAt });
	}

	/**
	 * Hydrate a domain role from its Lucid model representation.
	 *
	 * @param model - The persisted role. `permissions` and `users` are
	 *   domain-hydrated relation arrays: `null` (or omitted) means the relation
	 *   was not loaded, an empty array means it was loaded and is empty.
	 */
	static fromModel(model: {
		id: number;
		slug: string;
		name: string;
		description: string | null;
		isSystem: boolean;
		permissions?: readonly Permission[] | null;
		users?: readonly User[] | null;
		usersCount?: number | null;
		createdAt: Date | null;
		updatedAt: Date | null;
	}): Role {
		return new Role(
			RoleIdentifier.of(model.id),
			model.slug,
			model.name,
			model.description,
			model.isSystem,
			model.permissions ?? null,
			model.users ?? null,
			model.usersCount ?? null,
			model.createdAt,
			model.updatedAt,
		);
	}

	/**
	 * The administrator role slug. System roles are seeded under this slug and
	 * carry every permission.
	 */
	static readonly ADMIN_SLUG = 'admin';

	/** Whether this role is the administrator role. */
	isAdmin(): boolean {
		return this.slug === Role.ADMIN_SLUG;
	}

	/** Whether this role may be modified. System roles are immutable. */
	canBeModified(): boolean {
		return !this.isSystem;
	}

	/** Whether this role may be deleted. System roles are undeletable. */
	canBeDeleted(): boolean {
		return !this.isSystem;
	}

	/** Whether this role grants the given permission slug. */
	hasPermission(permissionSlug: string): boolean {
		return (this.permissions ?? []).some((permission) => permission.slug === permissionSlug);
	}

	/** The slugs of the permissions this role grants, empty when none are loaded. */
	permissionSlugs(): string[] {
		return (this.permissions ?? []).map((permission) => permission.slug);
	}
}

/**
 * The identity role-entry shape carried through the admin i18n payload
 * builders: a lightweight projection of a {@link Role} holding only the slug
 * plus the display name and description, without the persistence and permission
 * machinery. Data-driven per-role translation nodes are keyed by this slug.
 */
export type RoleEntry = {
	slug: string;
	name: string;
	description: string | null;
};
