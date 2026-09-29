import { inject } from '@adonisjs/core';
import { LogService } from '#log/services/log_service';

interface LogoutPayload {
	userId: number;
	userEmail: string;
}

/**
 * Handle user logout by recording the event.
 */
@inject()
export class LogoutAction {
	constructor(protected logService: LogService) {}

	/**
	 * @param payload - The id and email of the user logging out.
	 * @returns Nothing; side-effect only (logging).
	 */
	async execute(payload: LogoutPayload): Promise<void> {
		this.logService.logAuth('logout', { userId: payload.userId, userEmail: payload.userEmail });
	}
}
