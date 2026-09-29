import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import { withTransaction } from '#core/services/with_transaction';
import User from '#identity/models/user';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';

interface DeleteUserPayload {
	id: number;
}

/**
 * Permanently delete a user by ID.
 */
@inject()
export class DeleteUserAction {
	constructor(
		protected userRepository: UserRepository,
		protected logService: LogService,
	) {}

	/**
	 * Execute user deletion.
	 *
	 * @param payload - The user ID to delete.
	 * @returns `true` when the user is deleted successfully.
	 * @throws {RowNotFoundException} When the user does not exist.
	 */
	async execute(payload: DeleteUserPayload): Promise<boolean> {
		const user = await this.userRepository.findById(payload.id);

		if (!user) {
			throw new RowNotFoundException(User);
		}

		const deleted = await withTransaction(async () => this.userRepository.delete(payload.id));

		// Log only after the deletion actually succeeded.
		this.logService.logBusiness('user.deleted', {}, { userId: user.id, email: user.email, username: user.username });
		return deleted;
	}
}
