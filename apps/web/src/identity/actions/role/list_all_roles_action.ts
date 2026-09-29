import { inject } from '@adonisjs/core';
import Role from '#identity/models/role';
import { RoleRepository } from '#identity/repositories/role_repository';

/**
 * List all roles sorted alphabetically. Read-only operation.
 */
@inject()
export class ListAllRolesAction {
	constructor(protected roleRepository: RoleRepository) {}

	/**
	 * Execute role listing.
	 *
	 * @returns An array of all {@link Role} records sorted by name.
	 *
	 * @example
	 * const roles = await listAllRolesAction.execute()
	 */
	async execute(): Promise<Role[]> {
		return this.roleRepository.findAll({ orderBy: 'name' });
	}
}
