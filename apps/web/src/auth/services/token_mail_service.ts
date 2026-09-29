import { inject } from '@adonisjs/core';
import { GetPreferencesAction } from '#account/actions/preferences/get_preferences_action';
import { TOKEN_TYPES, type FullToken } from '#auth/enums/token_type';
import { TokenService } from '#auth/services/token_service';
import { MailService } from '#core/services/mail_service';
import { TOKEN_MAIL_SPECS } from '#core/token_mail_specs';
import type { TokenMailMessage } from '#core/types/token_mail';
import type User from '#identity/models/user';

/**
 * Issues auth-domain tokens and sends their mail directly.
 *
 * Replaces the previous events → listeners → Mailables chain with one direct,
 * traceable call per flow. Every flow is described by a row of
 * {@link TOKEN_MAIL_SPECS} and shares the same orchestration:
 *   1. Resolve the user's locale from their preferences
 *   2. Issue the token through the auth-domain {@link TokenService} with the
 *      row's TTL — the single issuance choreography (expire outstanding
 *      tokens of the type, generate the split token, hash the validator,
 *      persist the record)
 *   3. Build the mail payload from the row through the shared
 *      {@link MailService.buildTokenMail} assembly
 *   4. Dispatch it through the kernel {@link MailService}
 */
@inject()
export class TokenMailService {
	constructor(
		protected mailService: MailService<TokenMailMessage>,
		protected getPreferencesAction: GetPreferencesAction,
		protected tokenService: TokenService,
	) {}

	/**
	 * Sends the email-verification mail for a freshly registered user.
	 *
	 * @param user - The user whose email should be verified.
	 */
	async sendVerificationEmail(user: User): Promise<void> {
		const spec = TOKEN_MAIL_SPECS.emailVerification;
		const locale = await this.resolveLocale(user);
		const token = await this.tokenService.issue(user, TOKEN_TYPES.EMAIL_VERIFICATION, spec.ttlHours!);

		await this.mailService.send(this.mailService.buildTokenMail(spec, { to: user.email, locale, token }), { locale });
	}

	/**
	 * Issues the password-reset token for a user through the
	 * {@link TokenService} (1-hour TTL, from the flow's spec row).
	 *
	 * Split from the mail dispatch so the token is created synchronously inside
	 * the request while the mail itself is sent later by a queue worker.
	 *
	 * @param user - The user requesting a password reset.
	 * @returns The raw `selector.validator` token to hand to the mail flow.
	 */
	async issuePasswordResetToken(user: User): Promise<FullToken> {
		return this.tokenService.issue(user, TOKEN_TYPES.PASSWORD_RESET, TOKEN_MAIL_SPECS.passwordReset.ttlHours!);
	}

	/**
	 * Sends the password-reset mail for an already-issued token.
	 *
	 * Runs in the queue worker (see {@link SendPasswordResetMailJob}), not in
	 * the HTTP request: the caller resolves the locale, builds the mail payload
	 * and dispatches it through the kernel {@link MailService}.
	 *
	 * @param user - The user requesting a password reset.
	 * @param token - The `selector.validator` token issued for this request.
	 */
	async sendPasswordResetMail(user: User, token: FullToken): Promise<void> {
		const spec = TOKEN_MAIL_SPECS.passwordReset;
		const locale = await this.resolveLocale(user);

		await this.mailService.send(this.mailService.buildTokenMail(spec, { to: user.email, locale, token }), { locale });
	}

	/**
	 * Sends the invitation mail for a pending user.
	 *
	 * @param user - The pending user that was invited.
	 */
	async sendInvitationEmail(user: User): Promise<void> {
		const spec = TOKEN_MAIL_SPECS.invitation;
		const locale = await this.resolveLocale(user);
		const token = await this.tokenService.issue(user, TOKEN_TYPES.PENDING_INVITE, spec.ttlHours!);

		await this.mailService.send(this.mailService.buildTokenMail(spec, { to: user.email, locale, token }), { locale });
	}

	/**
	 * Resolves the recipient's locale from their preferences, falling back to
	 * the app default through the kernel {@link MailService}.
	 *
	 * @param user - The recipient the mail is addressed to.
	 * @returns The locale to render the mail in.
	 */
	protected async resolveLocale(user: User): Promise<string> {
		const preferences = await this.getPreferencesAction.execute({ user });
		return this.mailService.resolveLocale(preferences.locale);
	}
}
