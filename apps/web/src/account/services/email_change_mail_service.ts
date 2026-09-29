import { inject } from '@adonisjs/core';
import { GetPreferencesAction } from '#account/actions/preferences/get_preferences_action';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import { TokenService } from '#auth/services/token_service';
import { MailService } from '#core/services/mail_service';
import { TOKEN_MAIL_SPECS } from '#core/token_mail_specs';
import env from '#start/env';
import type { TokenMailMessage } from '#core/types/token_mail';
import type User from '#identity/models/user';

/**
 * Sends the mail pair of a pending email address change.
 *
 * Replaces the previous `InitiateEmailChange` event → listeners → Mailables
 * chain with one direct, traceable call per flow. Both mails are built from
 * their {@link TOKEN_MAIL_SPECS} row through the shared
 * {@link MailService.buildTokenMail} assembly:
 *   1. Resolve the user's locale from their preferences
 *   2. Issue the email-change token (TTL from the confirmation row) through
 *      the auth-domain {@link TokenService} — the single issuance choreography
 *   3. Send the confirmation mail (with the flavored confirmation link) to
 *      the new, pending address
 *   4. Send the notification mail (no link, with the support contact) to the
 *      current address
 */
@inject()
export class EmailChangeMailService {
	constructor(
		protected mailService: MailService<TokenMailMessage>,
		protected getPreferencesAction: GetPreferencesAction,
		protected tokenService: TokenService,
	) {}

	/**
	 * Issues the email-change token and delivers both mails for the user's
	 * pending email change.
	 *
	 * @param user - The user whose `pendingEmail` was just set.
	 */
	async sendEmailChangeMails(user: User): Promise<void> {
		const preferences = await this.getPreferencesAction.execute({ user });
		const locale = this.mailService.resolveLocale(preferences.locale);
		const token = await this.tokenService.issue(
			user,
			TOKEN_TYPES.EMAIL_CHANGE,
			TOKEN_MAIL_SPECS.emailChangeConfirmation.ttlHours!,
		);

		await this.mailService.send(
			this.mailService.buildTokenMail(TOKEN_MAIL_SPECS.emailChangeConfirmation, {
				to: user.pendingEmail!,
				locale,
				token,
				i18nParams: { email: user.pendingEmail },
			}),
			{ locale },
		);

		await this.mailService.send(
			this.mailService.buildTokenMail(TOKEN_MAIL_SPECS.emailChangeNotification, {
				to: user.email,
				locale,
				i18nParams: { old: user.email, new: user.pendingEmail },
				data: { support: env.get('MAIL_FROM_ADDRESS') },
			}),
			{ locale },
		);
	}
}
