import ApiClientUrlMissingException from '#auth/exceptions/api_client_url_missing_exception';
import { type OAuthProvider } from '#auth/types/auth';
import env from '#start/env';
import type { SocialApiLoginAction } from '#auth/actions/social/social_api_login_action';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Complete an OAuth callback in API mode: issue an API token for the provider
 * user and redirect the caller to the configured `AUTH_API_CLIENT_URL` with
 * the token (spec #6 "social API mode").
 *
 * Shared by the front {@link SocialController} (API mode) and the api flavor's
 * {@link SocialApiController}, so the token-issuing flow lives in one place.
 * Errors redirect to the client URL with an `error` query parameter; a missing
 * client URL is a hard config error.
 *
 * @param ctx - The HTTP context of the callback request.
 * @param provider - The OAuth provider that completed the callback.
 * @param socialApiLoginAction - Resolves the provider user and issues a token.
 * @returns The redirect response to the client URL.
 */
export async function completeSocialApiCallback(
	ctx: HttpContext,
	provider: OAuthProvider,
	socialApiLoginAction: SocialApiLoginAction,
) {
	const clientUrl = env.get('AUTH_API_CLIENT_URL');

	if (!clientUrl) {
		throw new ApiClientUrlMissingException();
	}

	const { ally, response } = ctx;
	const providerInstance = ally.use(provider);

	const redirectToClient = (error?: string) => {
		const url = new URL(clientUrl);
		if (error) url.searchParams.set('error', error);
		return response.redirect().toPath(url.toString());
	};

	if (providerInstance.accessDenied()) return redirectToClient('access_denied');
	if (providerInstance.stateMisMatch()) return redirectToClient('state_mismatch');
	if (providerInstance.hasError()) return redirectToClient('oauth_error');

	const allyUser = await providerInstance.user();
	const { token, expiresAt } = await socialApiLoginAction.execute({ provider, allyUser });

	const url = new URL(clientUrl);
	url.searchParams.set('token', token);
	if (expiresAt) url.searchParams.set('expires_at', expiresAt.toISOString());
	return response.redirect().toPath(url.toString());
}
