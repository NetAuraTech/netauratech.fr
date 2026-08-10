import { inject } from '@adonisjs/core'
import User from '#models/auth/user'

interface NeedsPasswordSetupPayload {
  user: User
}

/**
 * Check whether a social-only user needs to set up a native password.
 */
@inject()
export class NeedsPasswordSetupAction {
  constructor() {}

  /**
   * @param payload - The User to check
   * @returns true if the user has no password hash stored
   */
  async execute(payload: NeedsPasswordSetupPayload): Promise<boolean> {
    const hasSocialAccount =
      payload.user.githubId || payload.user.googleId || payload.user.facebookId
    return !payload.user.password && !!hasSocialAccount
  }
}
