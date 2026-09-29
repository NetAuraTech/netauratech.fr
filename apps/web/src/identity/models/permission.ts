import { manyToMany } from '@adonisjs/lucid/orm';
import { PermissionSchema } from '#database/schema';
import { Permission as PermissionEntity } from '#identity/domain/permission';
import Role from '#identity/models/role';
import type { ManyToMany } from '@adonisjs/lucid/types/relations';

export default class Permission extends PermissionSchema {
	@manyToMany(() => Role, {
		pivotTable: 'role_permission',
		pivotTimestamps: {
			createdAt: 'created_at',
			updatedAt: false,
		},
	})
	declare roles: ManyToMany<typeof Role>;

	/**
	 * Check if permission can be deleted
	 */
	get canBeDeleted(): boolean {
		return this.toDomain().canBeDeleted();
	}

	/**
	 * Check if permission can be modified
	 */
	get canBeModified(): boolean {
		return this.toDomain().canBeModified();
	}

	/**
	 * Project this model onto its pure domain representation. The mutability
	 * and deletability invariants live on the domain object; these getters are
	 * thin delegations.
	 */
	toDomain(): PermissionEntity {
		return PermissionEntity.fromModel({
			id: this.id,
			slug: this.slug,
			name: this.name,
			description: this.description,
			category: this.category,
			isSystem: this.isSystem,
			createdAt: this.createdAt?.toJSDate() ?? null,
			updatedAt: this.updatedAt?.toJSDate() ?? null,
		});
	}
}
