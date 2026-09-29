import { inject } from '@adonisjs/core';
import { DefineSocialPasswordAction } from '#auth/actions/social/define_social_password_action';
import { FindOrCreateSocialUserAction } from '#auth/actions/social/find_or_create_social_user_action';
import { LinkSocialProviderAction } from '#auth/actions/social/link_social_provider_action';
import { NeedsPasswordSetupAction } from '#auth/actions/social/needs_password_setup_action';
import { SocialApiLoginAction } from '#auth/actions/social/social_api_login_action';
import { UnlinkSocialProviderAction } from '#auth/actions/social/unlink_social_provider_action';
import { validateProvider } from '#auth/oauth_providers';
import { OAuthProvider } from '#auth/types/auth';
import { regenerateCsrfToken } from '#transport/auth/helpers/crsf';
import { buildSocialDefinePasswordPayload } from '#transport/auth/helpers/i18n_payloads/social_define_password';
import { completeSocialApiCallback } from '#transport/auth/helpers/social_api_callback';
import { definePasswordValidator } from '#transport/auth/validators/auth';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class SocialController {
	constructor(
		protected i18n: I18nService,
		protected defineSocialPasswordAction: DefineSocialPasswordAction,
		protected findOrCreateSocialUserAction: FindOrCreateSocialUserAction,
		protected linkSocialProviderAction: LinkSocialProviderAction,
		protected unlinkSocialProviderAction: UnlinkSocialProviderAction,
		protected needsPasswordSetupAction: NeedsPasswordSetupAction,
		protected socialApiLoginAction: SocialApiLoginAction,
	) {}

	async redirect(ctx: HttpContext) {
		const { ally, params, request, session } = ctx;

		const provider = params.provider as OAuthProvider;

		validateProvider(provider);

		// API mode: the callback issues an API token and redirects to the
		// configured client URL instead of creating a session. Intent is carried
		// through the provider round-trip in the session.
		if (request.input('mode') === 'api') {
			session.put('oauth.api_mode', true);
		}

		return ally.use(provider).redirect();
	}

	async callback(ctx: HttpContext) {
		const { ally, params, auth, response, session } = ctx;

		const provider = params.provider as OAuthProvider;

		validateProvider(provider);

		// API mode (spec #6): issue an API token and redirect to the client URL.
		if (session.pull('oauth.api_mode') === true) {
			return completeSocialApiCallback(ctx, provider, this.socialApiLoginAction);
		}

		const providerInstance = ally.use(provider);

		if (providerInstance.accessDenied()) {
			session.flash('error', this.i18n.translate('auth.social.access_denied'));
			return response.redirect().toRoute('auth.session.render');
		}

		if (providerInstance.stateMisMatch()) {
			session.flash('error', this.i18n.translate('auth.social.state_mismatch'));
			return response.redirect().toRoute('auth.session.render');
		}

		if (providerInstance.hasError()) {
			session.flash('error', providerInstance.getError() ?? this.i18n.translate('common.unexpected_error'));
			return response.redirect().toRoute('auth.session.render');
		}

		const allyUser = await providerInstance.user();
		const authenticatedUser = auth.user;

		if (authenticatedUser) {
			await this.linkSocialProviderAction.execute({ user: authenticatedUser, allyUser, provider });
			regenerateCsrfToken(ctx);
			session.flash('success', this.i18n.translate('auth.social.linked', { provider }));
			return response.redirect().toRoute('account.account.render');
		}

		const user = await this.findOrCreateSocialUserAction.execute({ allyUser, provider });
		await auth.use('web').login(user);

		if (await this.needsPasswordSetupAction.execute({ user })) {
			session.flash('info', this.i18n.translate('auth.social.set_password_info'));
			return response.redirect().toRoute('auth.social.render');
		}

		session.flash('success', this.i18n.translate('auth.session.login.success'));
		return response.redirect().toRoute('account.profile.render');
	}

	async unlink(ctx: HttpContext) {
		const { auth, params, response, session } = ctx;

		const provider = params.provider as OAuthProvider;

		validateProvider(provider);

		const user = auth.getUserOrFail();
		await this.unlinkSocialProviderAction.execute({ user, provider });

		if (await this.needsPasswordSetupAction.execute({ user })) {
			session.flash('warning', this.i18n.translate('auth.social.password_required_after_unlink'));
			return response.redirect().toRoute('auth.social.render');
		}

		regenerateCsrfToken(ctx);
		session.flash('success', this.i18n.translate('auth.social.unlinked', { provider }));

		return response.redirect().back();
	}

	async render(ctx: HttpContext) {
		const { inertia } = ctx;

		return renderInertiaPage(inertia, 'auth/front/define_password', {
			translations: buildSocialDefinePasswordPayload(this.i18n),
		});
	}

	async execute(ctx: HttpContext) {
		const { auth, request, response, session } = ctx;

		const user = auth.getUserOrFail();
		const payload = await definePasswordValidator.validate(request.all());

		await this.defineSocialPasswordAction.execute({ user, password: payload.password });

		regenerateCsrfToken(ctx);
		session.flash('success', this.i18n.translate('auth.social.password_defined'));
		return response.redirect().toRoute('account.account.render');
	}
}
