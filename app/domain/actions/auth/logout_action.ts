import { inject } from '@adonisjs/core'
import { LogService } from '#services/logging/log_service'

interface LogoutPayload {
  userId: number
}

/**
 * Handle user logout by recording the event..
 */
@inject()
export class LogoutAction {
  constructor(protected logService: LogService) {}

  /**
   * @param payload - The id of the user logging out.
   * @returns Nothing; side-effect only (logging).
   */
  async execute(payload: LogoutPayload): Promise<void> {
    this.logService.logAuth('logout', { userId: payload.userId })
  }
}
