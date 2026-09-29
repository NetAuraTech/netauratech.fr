import { inject } from '@adonisjs/core';
import hash from '@adonisjs/core/services/hash';
import InvalidCurrentPasswordException from '#auth/exceptions/invalid_current_password_exception';
import { withTransaction } from '#core/services/with_transaction';
import User from '#identity/models/user';
import { LogService } from '#log/services/log_service';

interface DeleteUserAccountPayload {
	user: User;
	password: string;
}

/**
 * Permanently delete the authenticated user account after password verification.
 */
@inject()
export class DeleteUserAccountAction {
	constructor(protected logService: LogService) {}

	/**
	 * Execute account deletion.
	 *
	 * @param payload - Authenticated user and their current password for confirmation.
	 * @returns `true` when deletion succeeds.
	 * @throws {InvalidCurrentPasswordException} If the password does not match.
	 */
	async execute(payload: DeleteUserAccountPayload): Promise<boolean> {
		const isPasswordValid = await hash.verify(payload.user.password!, payload.password);

		if (!isPasswordValid) {
			this.logService.logSecurity('Failed account deletion attempt - invalid password', {
				userId: payload.user.id,
				userEmail: payload.user.email,
			});
			throw new InvalidCurrentPasswordException();
		}

		await withTransaction(async () => {
			await payload.user.delete();
		});

		// Log only after the deletion actually succeeded. The deleted user can no
		// longer be referenced as actor (FK), so the id goes to metadata and the
		// email — the durable identifier — to the context.
		this.logService.logBusiness(
			'account.deleted',
			{ userEmail: payload.user.email },
			{ deletedUserId: payload.user.id, deletedAt: new Date().toISOString() },
		);
		return true;
	}
}
