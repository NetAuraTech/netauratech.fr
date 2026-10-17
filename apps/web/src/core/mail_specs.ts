import { TOKEN_TYPES } from '#auth/enums/token_type';
import type { MailSpec } from '#core/types/mail';

/**
 * Catalog of the mail flows: one spec row per flow — token and contact alike —
 * holding the i18n key block, the flavor-aware candidate routes of the mail
 * link, the token type and TTL of flows that issue a token, and the template.
 *
 * The per-domain mail services (auth's `TokenMailService`, account's
 * `EmailChangeMailService`, CMS's `ContactMailService`) build every mail from
 * its row plus the shared `MailService.buildMail` assembly — a new mail flow
 * is a new row here, not a hand-assembled payload block. Token-issuing flows
 * carry their {@link TOKEN_TYPES} member on the row, so callers never pair a
 * token type with a spec row by hand.
 *
 * The rows are plain data (i18n key strings, route names, token types,
 * numbers): the kernel owns no domain code, and the candidate routes keep the
 * mails flavor-aware — in the headless `api` flavor the front routes are
 * absent and the first registered candidate wins at runtime.
 */

/**
 * The name of a mail flow, one per row of {@link MAIL_SPECS}.
 */
export type MailFlow =
	| 'emailVerification'
	| 'passwordReset'
	| 'invitation'
	| 'emailChangeConfirmation'
	| 'emailChangeNotification'
	| 'contactForm';

export const MAIL_SPECS: Record<MailFlow, MailSpec> = {
	/** Email verification mail, sent to a freshly registered user. */
	emailVerification: {
		keys: {
			subject: 'auth.verify_email.mail.subject',
			greeting: 'auth.verify_email.mail.greeting',
			intro: 'auth.verify_email.mail.intro',
			action: 'auth.verify_email.mail.action',
			outro: 'auth.verify_email.mail.outro',
			expiry: 'auth.verify_email.mail.expiry',
			footer: 'auth.verify_email.mail.footer',
		},
		linkRoutes: ['auth.email_verification.execute', 'api.v1.auth.email_verification.store'],
		linkSlot: 'verification_link',
		tokenType: TOKEN_TYPES.EMAIL_VERIFICATION,
		ttlHours: 24,
		template: 'emails/auth_email',
	},
	/** Password-reset mail, sent for a pre-issued token by the queue worker. */
	passwordReset: {
		keys: {
			subject: 'auth.reset_password.mail.subject',
			greeting: 'auth.reset_password.mail.greeting',
			intro: 'auth.reset_password.mail.intro',
			action: 'auth.reset_password.mail.action',
			outro: 'auth.reset_password.mail.outro',
			expiry: 'auth.reset_password.mail.expiry',
			footer: 'auth.reset_password.mail.footer',
		},
		linkRoutes: ['auth.reset_password.render', 'api.v1.auth.reset_password.store'],
		linkSlot: 'reset_link',
		tokenType: TOKEN_TYPES.PASSWORD_RESET,
		ttlHours: 1,
		template: 'emails/auth_email',
	},
	/** Invitation mail, sent to a pending user invited by an administrator. */
	invitation: {
		keys: {
			subject: 'identity.admin.users.mail.subject',
			greeting: 'identity.admin.users.mail.greeting',
			intro: 'identity.admin.users.mail.intro',
			action: 'identity.admin.users.mail.action',
			outro: 'identity.admin.users.mail.outro',
			expiry: 'identity.admin.users.mail.expiry',
			footer: 'identity.admin.users.mail.footer',
		},
		linkRoutes: ['auth.accept_invitation.render', 'api.v1.auth.accept_invitation.store'],
		linkSlot: 'accept_link',
		tokenType: TOKEN_TYPES.PENDING_INVITE,
		ttlHours: 7 * 24,
		template: 'emails/admin_invite_email',
	},
	/** Email-change confirmation mail, sent to the new, pending address. */
	emailChangeConfirmation: {
		keys: {
			subject: 'account.email.change.mail.confirm.subject',
			greeting: 'account.email.change.mail.confirm.greeting',
			intro: 'account.email.change.mail.confirm.intro',
			action: 'account.email.change.mail.confirm.action',
			outro: 'account.email.change.mail.confirm.outro',
			expiry: 'account.email.change.mail.confirm.expiry',
			footer: 'account.email.change.mail.confirm.footer',
		},
		linkRoutes: ['account.email_change.render'],
		linkSlot: 'confirmation_link',
		tokenType: TOKEN_TYPES.EMAIL_CHANGE,
		ttlHours: 24,
		template: 'emails/account_email',
	},
	/**
	 * Email-change notification mail, sent to the current address; carries no
	 * link and issues no token of its own (the confirmation flow owns the
	 * shared email-change token).
	 */
	emailChangeNotification: {
		keys: {
			subject: 'account.email.change.mail.notification.subject',
			greeting: 'account.email.change.mail.notification.greeting',
			intro: 'account.email.change.mail.notification.intro',
			warning: 'account.email.change.mail.notification.warning',
			action: 'account.email.change.mail.notification.action',
		},
		linkRoutes: [],
		template: 'emails/account_email',
	},
	/**
	 * Contact-form notification mail, sent to the site administrator on a
	 * front contact-form submission. Carries no link and issues no token; the
	 * per-field value translations stay domain-side (CMS) and ride the payload
	 * through the `fields` data slot.
	 */
	contactForm: {
		keys: {
			subject: 'cms.page.contact_form.mail.subject',
			greeting: 'cms.page.contact_form.mail.greeting',
			intro: 'cms.page.contact_form.mail.intro',
		},
		linkRoutes: [],
		template: 'emails/contact_form_email',
	},
};
