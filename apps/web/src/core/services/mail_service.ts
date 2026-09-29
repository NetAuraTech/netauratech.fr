import { inject } from '@adonisjs/core';
import i18nManager from '@adonisjs/i18n/services/main';
import { MailClientContract, type MailClientMessage } from '#core/contracts/mail_client';
import { routePath } from '#core/services/route_path';
import env from '#start/env';
import type { TokenMailBuildInput, TokenMailData, TokenMailMessage, TokenMailSpec } from '#core/types/token_mail';

/**
 * The i18n data slots of a token mail, in template order — the slots filled
 * from the spec's i18n key block. The envelope slots (`app_name`, `subject`)
 * and the link slot are assembled separately by {@link MailService.buildTokenMail}.
 */
const TOKEN_MAIL_I18N_SLOTS = ['greeting', 'intro', 'action', 'outro', 'expiry', 'footer', 'warning'] as const;

/**
 * Options of a shared mail dispatch.
 */
export interface MailDispatchOptions {
	/** Recipient locale, resolved by the domain flow from the user's preferences. */
	locale: string;
}

/**
 * The kernel mail service: the single dispatch home of every mail flow.
 *
 * Generic over the mail payload type {@link TPayload} (which must at least
 * carry the {@link MailClientMessage} envelope) so each flow can supply a
 * strongly-typed payload. Delivery is delegated to the injected
 * {@link MailClientContract}, which the application binds to a wrapper
 * around the framework mail driver.
 *
 * The service owns the shared dispatch — locale handling, link building,
 * token-mail payload assembly and sending. Per-domain mail services keep
 * building their domain-specific payload (i18n strings, token, template data)
 * and go through this service; the kernel never imports a domain, so the
 * domain side resolves what the dispatch needs (the recipient's locale) and
 * hands it over.
 *
 * @example
 * const mailService = await app.container.make(MailService)
 * await mailService.send(
 *   { to: user.email, subject: 'Verify your email', template: 'emails/auth_email', data },
 *   { locale },
 * )
 */
@inject()
export class MailService<TPayload extends MailClientMessage = MailClientMessage> {
	constructor(protected mailClient: MailClientContract) {}

	/**
	 * Normalises the recipient's preferred locale, falling back to the app's
	 * default locale when it is unset.
	 *
	 * @param locale - The locale the domain flow resolved from the user's preferences.
	 * @returns The locale to render the mail in.
	 *
	 * @example
	 * const locale = mailService.resolveLocale(preferences.locale)
	 */
	resolveLocale(locale?: string): string {
		return locale || i18nManager.defaultLocale;
	}

	/**
	 * Compose and send a typed mail payload through the bound mail client.
	 *
	 * The resolved locale is stamped into the template data before delivery,
	 * so every mail template can read it (e.g. `<html lang="{{ locale }}">`)
	 * without the domain flow carrying it in the payload.
	 *
	 * @param payload - The typed mail envelope to dispatch.
	 * @param options - The dispatch options (the resolved recipient locale).
	 *
	 * @example
	 * await mailService.send(
	 *   { to: user.email, subject, template: 'emails/auth_email', data },
	 *   { locale },
	 * )
	 */
	async send(payload: TPayload, options: MailDispatchOptions): Promise<void> {
		await this.mailClient.send({
			...payload,
			data: { locale: options.locale, ...payload.data },
		});
	}

	/**
	 * Builds the mail link for the current flavor.
	 *
	 * The full flavor links to the session pages; the headless `api` flavor
	 * falls back to the token API endpoints. The first registered route wins.
	 *
	 * @param routeNames - Candidate route names, in priority order.
	 * @param token - The full `<selector>.<validator>` token carried by the link.
	 * @returns The absolute URL, or an empty string when no candidate is
	 *   registered.
	 *
	 * @example
	 * const link = mailService.buildLink(
	 *   ['auth.reset_password.render', 'api.v1.auth.reset_password.store'],
	 *   token,
	 * )
	 */
	buildLink(routeNames: string[], token: string): string {
		for (const name of routeNames) {
			const path = routePath(name, { token });
			if (path) return `${env.get('APP_URL')}${path}`;
		}
		return '';
	}

	/**
	 * Assembles the mail payload of a token mail from its {@link TokenMailSpec}.
	 *
	 * The shared assembly step of every token mail flow: translates the spec's
	 * i18n key block in the recipient's locale, interpolating the app name and
	 * the TTL-derived `hours`/`days` values (plus any per-dispatch params from
	 * {@link TokenMailBuildInput.i18nParams}), builds the flavor-aware link
	 * from the spec's candidate routes when it has any, and stamps the extra
	 * data slots. The result is handed to {@link MailService.send} for
	 * dispatch.
	 *
	 * @param spec - The spec row of the mail flow.
	 * @param input - The dispatch input: recipient, resolved locale, token and per-dispatch extras.
	 * @returns The assembled mail envelope, ready for {@link MailService.send}.
	 * @throws {Error} When the spec row defines candidate routes but the input
	 *   carries no token (coded `E_TOKEN_MAIL_MISSING_TOKEN`).
	 *
	 * @example
	 * const payload = mailService.buildTokenMail(TOKEN_MAIL_SPECS.passwordReset, {
	 *   to: user.email,
	 *   locale,
	 *   token,
	 * })
	 * await mailService.send(payload, { locale })
	 */
	buildTokenMail(spec: TokenMailSpec, input: TokenMailBuildInput): TokenMailMessage {
		const i18n = i18nManager.locale(input.locale);
		const app = env.get('APP_NAME') ?? 'AdonisJS';
		const params: Record<string, unknown> = {
			app,
			...(spec.ttlHours !== undefined ? { hours: spec.ttlHours, days: Math.round(spec.ttlHours / 24) } : {}),
			...input.i18nParams,
		};

		const data: TokenMailData = {
			app_name: app,
			subject: i18n.t(spec.keys.subject, params),
		};
		for (const slot of TOKEN_MAIL_I18N_SLOTS) {
			const key = spec.keys[slot];
			if (key !== undefined) {
				data[slot] = i18n.t(key, params);
			}
		}
		if (spec.linkSlot && spec.linkRoutes.length > 0) {
			if (input.token === undefined) {
				throw Object.assign(
					new Error('buildTokenMail: the spec row defines candidate routes, so the token is required'),
					{ code: 'E_TOKEN_MAIL_MISSING_TOKEN' },
				);
			}
			data[spec.linkSlot] = this.buildLink(spec.linkRoutes, input.token);
		}
		if (input.data) {
			Object.assign(data, input.data);
		}

		return { to: input.to, subject: data.subject, template: spec.template, data };
	}
}
