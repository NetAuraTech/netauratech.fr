import { Entity } from '#core/domain/entity';
import { PermissionIdentifier } from '#identity/domain/identifiers';

/**
 * Pure domain object for an identity {@link Permission}.
 *
 * Encapsulates the business invariants of a permission outside the
 * persistence layer. System permissions (seeded from the permission catalog)
 * are immutable; custom permissions may be modified and deleted. Hydrate one
 * from a model with {@link Permission.fromModel}.
 */
export class Permission extends Entity<{
	id: PermissionIdentifier;
	slug: string;
	name: string;
	description: string | null;
	category: string;
	isSystem: boolean;
	createdAt: Date | null;
	updatedAt: Date | null;
}> {
	private constructor(
		readonly id: PermissionIdentifier,
		readonly slug: string,
		readonly name: string,
		readonly description: string | null,
		readonly category: string,
		readonly isSystem: boolean,
		readonly createdAt: Date | null,
		readonly updatedAt: Date | null,
	) {
		super({ id, slug, name, description, category, isSystem, createdAt, updatedAt });
	}

	/**
	 * Hydrate a domain permission from its Lucid model representation.
	 *
	 * @param model - The persisted permission.
	 */
	static fromModel(model: {
		id: number;
		slug: string;
		name: string;
		description: string | null;
		category: string;
		isSystem: boolean;
		createdAt: Date | null;
		updatedAt: Date | null;
	}): Permission {
		return new Permission(
			PermissionIdentifier.of(model.id),
			model.slug,
			model.name,
			model.description,
			model.category,
			model.isSystem,
			model.createdAt,
			model.updatedAt,
		);
	}

	/** Whether this permission may be modified. System permissions are immutable. */
	canBeModified(): boolean {
		return !this.isSystem;
	}

	/** Whether this permission may be deleted. System permissions are undeletable. */
	canBeDeleted(): boolean {
		return !this.isSystem;
	}
}
