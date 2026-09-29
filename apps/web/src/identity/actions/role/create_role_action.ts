import { inject } from '@adonisjs/core';
import SlugExistsException from '#core/exceptions/slug_exists_exception';
import { withTransaction } from '#core/services/with_transaction';
import Role from '#identity/models/role';
import { RoleRepository } from '#identity/repositories/role_repository';

interface CreateRolePayload {
	name: string;
	slug: string;
	description: string | null;
	permissionIds?: number[];
}

/**
 * Create a custom role and assign its initial permissions.
 */
@inject()
export class CreateRoleAction {
	constructor(protected roleRepository: RoleRepository) {}

	/**
	 * Execute role creation.
	 *
	 * @param payload - The role attributes and the permission ids to grant.
	 * @returns The newly created role with its permissions preloaded.
	 * @throws {SlugExistsException} When another role already uses the slug.
	 *
	 * @example
	 * const role = await createRoleAction.execute({
	 *   name: 'Editor',
	 *   slug: 'editor',
	 *   description: 'Can manage editorial content',
	 *   permissionIds: [1, 2],
	 * })
	 */
	async execute(payload: CreateRolePayload): Promise<Role> {
		const existing = await this.roleRepository.findBySlug(payload.slug);

		if (existing) {
			throw new SlugExistsException(payload.slug);
		}

		return withTransaction(async () => {
			const role = await this.roleRepository.create({
				name: payload.name,
				slug: payload.slug,
				description: payload.description,
				isSystem: false,
			});

			if (payload.permissionIds?.length) {
				await role.syncPermissions(payload.permissionIds);
			}

			await role.load('permissions');
			return role;
		});
	}
}
