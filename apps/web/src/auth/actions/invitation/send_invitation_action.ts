import { inject } from '@adonisjs/core';
import { InvitationService } from '#auth/services/invitation_service';
import type User from '#identity/models/user';

interface SendInvitationPayload {
	email: string;
	roleId?: number | null;
}

/**
 * Create a pending user and send an invitation email.
 *
 * Delegates to the auth-domain {@link InvitationService}, which owns the
 * "create pending user + send invitation mail" flow.
 */
@inject()
export class SendInvitationAction {
	constructor(protected invitationService: InvitationService) {}

	/**
	 * Execute invitation sending.
	 *
	 * @param payload - Email address of the invitee and optional role ID.
	 * @returns The created {@link User} in pending state.
	 * @throws {EmailAlreadyExistsException} When the email is already registered.
	 */
	async execute(payload: SendInvitationPayload): Promise<User> {
		return this.invitationService.sendInvitation(payload);
	}
}
