import { createI18nEntry, type BuildPayloadResult, type I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the invitation acceptance page. `banner.title` is
 * re-wrapped at build time with the invitee's actual email, since the page is
 * shown to a specific invitee.
 */
export const ACCEPT_INVITATION_MAPPING = {
	title: 'auth.invitation.title',
	sub_title: 'auth.invitation.sub_title',
	email: {
		value: 'auth.invitation.email.value',
		placeholder: 'auth.invitation.email.placeholder',
		help: 'auth.invitation.email.help',
	},
	username: {
		value: 'auth.invitation.username.value',
		placeholder: 'auth.invitation.username.placeholder',
		help: 'auth.invitation.username.help',
	},
	password: {
		confirmation: {
			help: 'auth.invitation.password.confirmation.help',
			value: 'auth.invitation.password.confirmation.value',
		},
		help: 'auth.invitation.password.help',
		value: 'auth.invitation.password.value',
	},
	banner: {
		title: 'auth.invitation.banner.title',
		message: 'auth.invitation.banner.message',
	},
	submit: 'auth.invitation.submit',
};

/**
 * Shape of the resolved translation payload for the invitation acceptance page.
 */
export type AcceptInvitationTranslations = BuildPayloadResult<typeof ACCEPT_INVITATION_MAPPING>;

/**
 * Builds the resolved translation payload for the invitation acceptance page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @param email - The email address the invitation was sent to.
 * @returns The invitation `t` object with every UI string resolved.
 */
export function buildAcceptInvitationPayload(i18n: I18nTranslator, email: string) {
	return i18n.buildPayload({
		...ACCEPT_INVITATION_MAPPING,
		banner: {
			...ACCEPT_INVITATION_MAPPING.banner,
			title: createI18nEntry(ACCEPT_INVITATION_MAPPING.banner.title, { email }),
		},
	});
}
