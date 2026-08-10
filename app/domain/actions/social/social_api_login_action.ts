import { inject } from '@adonisjs/core'
import type User from '#models/auth/user'
import type { OAuthProvider } from '#types/auth'
import type { AllyUserContract } from '@adonisjs/ally/types'
import { FindOrCreateSocialUserAction } from '#actions/social/find_or_create_social_user_action'
import { CreateApiTokenAction, type ApiTokenResult } from '#actions/auth/create_api_token_action'

interface SocialApiLoginPayload {
  provider: OAuthProvider
  allyUser: AllyUserContract<any>
}

export interface SocialApiLoginResult extends ApiTokenResult {
  user: User
}

/**
 * Resolve a provider user and issue an API token for it, without creating a
 * session (spec #6 "social API mode").
 *
 * Reuses the existing social-resolution action and the shared API-token
 * action — this flow only composes them for the token-authenticated world.
 */
@inject()
export class SocialApiLoginAction {
  constructor(
    protected findOrCreateSocialUserAction: FindOrCreateSocialUserAction,
    protected createApiTokenAction: CreateApiTokenAction
  ) {}

  /**
   * @param payload - The provider and the authenticated provider user.
   * @returns The resolved {@link User} and its issued API token.
   */
  async execute(payload: SocialApiLoginPayload): Promise<SocialApiLoginResult> {
    const user = await this.findOrCreateSocialUserAction.execute(payload)
    const { token, expiresAt } = await this.createApiTokenAction.execute({ user })
    return { user, token, expiresAt }
  }
}
