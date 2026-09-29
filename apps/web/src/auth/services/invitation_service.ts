import { inject } from '@adonisjs/core';
import { TokenMailService } from '#auth/services/token_mail_service';
import EmailAlreadyExistsException from '#core/exceptions/email_already_exists_exception';
import { withTransaction } from '#core/services/with_transaction';
import { extractNameFromEmail } from '#identity/domain/user';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

export interface InvitationPayload {
	email: string;
	roleId?: number | null;
}

/**
 * Creates a pending user and sends the invitation mail.
 *
 * Owns the invitation flow shared by the admin invitation entry point and
 * the admin user-creation flow. The invitation mail is sent directly through
 * the auth-domain {@link TokenMailService} — no event bus is involved.
 */
@inject()
export class InvitationService {
	constructor(
		protected logService: LogService,
		protected userRepository: UserRepository,
		protected tokenMailService: TokenMailService,
	) {}

	/**
	 * Create a pending user and send an invitation email.
	 *
	 * @param payload - Email address of the invitee and optional role ID.
	 * @returns The created {@link User} in pending state.
	 * @throws {EmailAlreadyExistsException} When the email is already registered.
	 *
	 * @example
	 * const user = await invitationService.sendInvitation({ email: 'invitee@test.com' })
	 */
	async sendInvitation(payload: InvitationPayload): Promise<User> {
		const existingUser = await this.userRepository.findByEmail(payload.email);

		if (existingUser) {
			this.logService.logAuth('invitation.failed.email_exists', {
				userEmail: payload.email,
			});
			throw new EmailAlreadyExistsException(payload.email);
		}

		const user = await withTransaction(async () => {
			return this.userRepository.create({
				email: payload.email,
				username: extractNameFromEmail(payload.email),
				password: null,
				roleId: payload.roleId ?? null,
			} as any);
		});

		await this.tokenMailService.sendInvitationEmail(user);

		this.logService.logAuth('invitation.sent', {
			userId: user.id,
			userEmail: user.email,
		});

		return user;
	}
}
