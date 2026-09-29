import { hasMany, manyToMany } from '@adonisjs/lucid/orm';
import { RoleSchema } from '#database/schema';
import { Role as RoleEntity } from '#identity/domain/role';
import Permission from '#identity/models/permission';
import User from '#identity/models/user';
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations';

export default class Role extends RoleSchema {
	@manyToMany(() => Permission, {
		pivotTable: 'role_permission',
		pivotTimestamps: {
			createdAt: 'created_at',
			updatedAt: false,
		},
	})
	declare permissions: ManyToMany<typeof Permission>;

	@hasMany(() => User)
	declare users: HasMany<typeof User>;

	/**
	 * Check if role has a specific permission
	 */
	async hasPermission(permissionSlug: string): Promise<boolean> {
		await (this as Role).load('permissions');
		return this.toDomain().hasPermission(permissionSlug);
	}

	/**
	 * Check if role is admin
	 */
	get isAdmin(): boolean {
		return this.toDomain().isAdmin();
	}

	/**
	 * Check if role can be deleted
	 */
	get canBeDeleted(): boolean {
		return this.toDomain().canBeDeleted();
	}

	/**
	 * Check if role can be modified
	 */
	get canBeModified(): boolean {
		return this.toDomain().canBeModified();
	}

	/**
	 * Project this model onto its pure domain representation. The business
	 * invariants (admin check, mutability, deletability, permission grants)
	 * live on the domain object; these getters are thin delegations.
	 */
	toDomain(): RoleEntity {
		return RoleEntity.fromModel({
			id: this.id,
			slug: this.slug,
			name: this.name,
			description: this.description,
			isSystem: this.isSystem,
			permissions: this.permissions === undefined ? null : this.permissions.map((permission) => permission.toDomain()),
			users: this.users === undefined ? null : this.users.map((user) => user.toDomain()),
			usersCount: this.$extras.users_count !== undefined ? Number(this.$extras.users_count) : null,
			createdAt: this.createdAt?.toJSDate() ?? null,
			updatedAt: this.updatedAt?.toJSDate() ?? null,
		});
	}

	/**
	 * Assign permission to role
	 */
	async assignPermission(permissionId: number): Promise<void> {
		await (this as Role).related('permissions').attach({ [permissionId]: {} });
	}

	/**
	 * Remove permission from role
	 */
	async removePermission(permissionId: number): Promise<void> {
		await (this as Role).related('permissions').detach([permissionId]);
	}

	/**
	 * Sync permissions (replace all)
	 *
	 * Computes the attach/detach diff explicitly instead of relying on Lucid's
	 * `sync()`, whose diff breaks when the driver returns pivot ids as strings
	 * (e.g. bigint columns over pg) — leading to duplicate pivot inserts.
	 */
	async syncPermissions(permissionIds: number[]): Promise<void> {
		const existing = await (this as Role).related('permissions').query().select('permissions.id');
		const existingIds = existing.map((permission) => permission.id);

		const toDetach = existingIds.filter((id) => !permissionIds.includes(id));
		const toAttach = permissionIds.filter((id) => !existingIds.includes(id));

		if (toDetach.length > 0) {
			await (this as Role).related('permissions').detach(toDetach);
		}

		if (toAttach.length > 0) {
			const pivotData: Record<number, Record<string, never>> = {};
			toAttach.forEach((id) => {
				pivotData[id] = {};
			});
			await (this as Role).related('permissions').attach(pivotData);
		}
	}
}
