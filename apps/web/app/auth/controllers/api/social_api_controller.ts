import { inject } from '@adonisjs/core';
import { SocialApiLoginAction } from '#auth/actions/social/social_api_login_action';
import { validateProvider } from '#auth/oauth_providers';
import { OAuthProvider } from '#auth/types/auth';
import { completeSocialApiCallback } from '#transport/auth/helpers/social_api_callback';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * OAuth social login for the headless `api` flavor (spec #6 "social API mode").
 *
 * The callback always issues an API token and redirects to the configured
 * `AUTH_API_CLIENT_URL` with the token — there is no session flow here. The
 * token-issuing logic is shared with the browser flow's API mode via
 * {@link completeSocialApiCallback}.
 */
@inject()
export default class SocialApiController {
	constructor(protected socialApiLoginAction: SocialApiLoginAction) {}

	/**
	 * GET /oauth/:provider — start the OAuth round-trip for a provider.
	 */
	async redirect(ctx: HttpContext) {
		const { ally, params } = ctx;

		const provider = params.provider as OAuthProvider;

		validateProvider(provider);

		return ally.use(provider).redirect();
	}

	/**
	 * GET /oauth/:provider/callback — issue an API token and redirect to the
	 * client URL.
	 */
	async callback(ctx: HttpContext) {
		const { params } = ctx;

		const provider = params.provider as OAuthProvider;

		validateProvider(provider);

		return completeSocialApiCallback(ctx, provider, this.socialApiLoginAction);
	}
}
