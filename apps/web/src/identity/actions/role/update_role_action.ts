import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import SlugExistsException from '#core/exceptions/slug_exists_exception';
import { withTransaction } from '#core/services/with_transaction';
import SystemRoleImmutableException from '#identity/exceptions/system_role_immutable_exception';
import Role from '#identity/models/role';
import { RoleRepository } from '#identity/repositories/role_repository';

interface UpdateRolePayload {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	permissionIds?: number[];
}

/**
 * Update a custom role and sync its permissions.
 */
@inject()
export class UpdateRoleAction {
	constructor(protected roleRepository: RoleRepository) {}

	/**
	 * Execute role update.
	 *
	 * @param payload - The role id, updated attributes and permission ids.
	 * @returns The updated role with its permissions preloaded.
	 * @throws {RowNotFoundException} When the role does not exist.
	 * @throws {SystemRoleImmutableException} When the role is a system role.
	 * @throws {SlugExistsException} When another role already uses the new slug.
	 *
	 * @example
	 * const role = await updateRoleAction.execute({
	 *   id: 3,
	 *   name: 'Editor',
	 *   slug: 'editor',
	 *   description: null,
	 *   permissionIds: [1, 2],
	 * })
	 */
	async execute(payload: UpdateRolePayload): Promise<Role> {
		const role = await this.roleRepository.findById(payload.id);

		if (!role) {
			throw new RowNotFoundException(Role);
		}

		if (!role.canBeModified) {
			throw new SystemRoleImmutableException(role.slug);
		}

		if (payload.slug !== role.slug) {
			const existing = await this.roleRepository.findBySlug(payload.slug);
			if (existing) {
				throw new SlugExistsException(payload.slug);
			}
		}

		return withTransaction(async () => {
			const updated = await this.roleRepository.update(payload.id, {
				name: payload.name,
				slug: payload.slug,
				description: payload.description,
			});

			if (payload.permissionIds) {
				await updated!.syncPermissions(payload.permissionIds);
			}

			await updated!.load('permissions');
			return updated!;
		});
	}
}
