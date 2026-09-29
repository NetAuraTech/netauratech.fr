import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import { withTransaction } from '#core/services/with_transaction';
import SystemRoleImmutableException from '#identity/exceptions/system_role_immutable_exception';
import Role from '#identity/models/role';
import { RoleRepository } from '#identity/repositories/role_repository';
import { UserRepository } from '#identity/repositories/user_repository';

interface DeleteRolePayload {
	id: number;
}

/**
 * Delete a custom role, reassigning its users to the default `user` role first.
 */
@inject()
export class DeleteRoleAction {
	constructor(
		protected roleRepository: RoleRepository,
		protected userRepository: UserRepository,
	) {}

	/**
	 * Execute role deletion.
	 *
	 * @param payload - The role id to delete.
	 * @returns `true` when the role is deleted successfully.
	 * @throws {RowNotFoundException} When the role does not exist or the default
	 *   `user` role is missing.
	 * @throws {SystemRoleImmutableException} When the role is a system role.
	 *
	 * @example
	 * await deleteRoleAction.execute({ id: 3 })
	 */
	async execute(payload: DeleteRolePayload): Promise<boolean> {
		const role = await this.roleRepository.findById(payload.id);

		if (!role) {
			throw new RowNotFoundException(Role);
		}

		if (!role.canBeDeleted) {
			throw new SystemRoleImmutableException(role.slug);
		}

		const fallback = await this.roleRepository.getUserRole();

		if (!fallback) {
			throw new RowNotFoundException(Role);
		}

		return withTransaction(async () => {
			await this.userRepository.reassignRole(role.id, fallback.id);
			return this.roleRepository.delete(role.id);
		});
	}
}
