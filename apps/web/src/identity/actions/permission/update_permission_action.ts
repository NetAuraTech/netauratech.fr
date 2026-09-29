import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import SlugExistsException from '#core/exceptions/slug_exists_exception';
import { withTransaction } from '#core/services/with_transaction';
import SystemPermissionImmutableException from '#identity/exceptions/system_permission_immutable_exception';
import Permission from '#identity/models/permission';
import { PermissionRepository } from '#identity/repositories/permission_repository';

interface UpdatePermissionPayload {
	id: number;
	name: string;
	slug: string;
	category: string;
	description: string | null;
}

/**
 * Update a custom permission.
 */
@inject()
export class UpdatePermissionAction {
	constructor(protected permissionRepository: PermissionRepository) {}

	/**
	 * Execute permission update.
	 *
	 * @param payload - The permission id and updated attributes.
	 * @returns The updated permission.
	 * @throws {RowNotFoundException} When the permission does not exist.
	 * @throws {SystemPermissionImmutableException} When the permission is a system permission.
	 * @throws {SlugExistsException} When another permission already uses the new slug.
	 *
	 * @example
	 * const permission = await updatePermissionAction.execute({
	 *   id: 42,
	 *   name: 'Publish articles',
	 *   slug: 'articles.publish',
	 *   category: 'articles',
	 *   description: null,
	 * })
	 */
	async execute(payload: UpdatePermissionPayload): Promise<Permission> {
		const permission = await this.permissionRepository.findById(payload.id);

		if (!permission) {
			throw new RowNotFoundException(Permission);
		}

		if (!permission.canBeModified) {
			throw new SystemPermissionImmutableException(permission.slug);
		}

		if (payload.slug !== permission.slug) {
			const existing = await this.permissionRepository.findBySlug(payload.slug);
			if (existing) {
				throw new SlugExistsException(payload.slug);
			}
		}

		return withTransaction(async () =>
			this.permissionRepository.update(payload.id, {
				name: payload.name,
				slug: payload.slug,
				category: payload.category,
				description: payload.description,
			}),
		) as Promise<Permission>;
	}
}
