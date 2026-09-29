import { inject } from '@adonisjs/core';
import { InvitationService } from '#auth/services/invitation_service';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

interface CreateUserPayload {
	email: string;
	roleId?: number | null;
}

/**
 * Create a new user and send an invitation.
 *
 * Delegates to the auth-domain {@link InvitationService}, which owns the
 * "create pending user + send invitation mail" flow (including the
 * invitation mail side-effect). This action keeps the identity-side entry
 * point (and its `user.created` log) for the admin surface.
 */
@inject()
export class CreateUserAction {
	constructor(
		protected logService: LogService,
		protected invitationService: InvitationService,
	) {}

	/**
	 * Execute user creation.
	 *
	 * @param payload - Email address and optional role ID for the new user.
	 * @returns The newly created {@link User}.
	 * @throws {EmailAlreadyExistsException} When the email is already registered.
	 */
	async execute(payload: CreateUserPayload): Promise<User> {
		const user = await this.invitationService.sendInvitation(payload);

		this.logService.logAuth('user.created', {
			userId: user.id,
			userEmail: user.email,
		});

		return user;
	}
}
