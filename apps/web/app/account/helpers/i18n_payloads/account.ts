import { createI18nEntry, type BuildPayloadResult, type I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the account settings section (credentials,
 * password, account deletion and OAuth connections).
 */
export const ACCOUNT_MAPPING = {
	header: {
		title: 'account.title',
		sub_title: 'account.sub_title',
		tabs: {
			profile: 'account.profile.value',
			account: 'account.account.value',
			preferences: 'account.preferences.value',
			admin: 'admin.value',
			logout: 'auth.session.logout.value',
		},
	},
	email: {
		title: 'account.account.email.title',
		sub_title: 'account.account.email.sub_title',
		submit: 'account.account.email.submit',
		placeholder: 'account.account.email.placeholder',
		value: 'account.account.email.value',
		change: {
			title: 'account.account.email.change.title',
			sub_title: 'account.account.email.change.sub_title',
			submit: 'account.account.email.change.submit',
			cancel: 'account.account.email.change.cancel',
			info: {
				title: 'account.account.email.change.info.title',
				message: 'account.account.email.change.info.message',
			},
		},
	},
	password: {
		title: 'account.account.password.title',
		sub_title: 'account.account.password.sub_title',
		submit: 'account.account.password.submit',
		current: {
			value: 'account.account.password.current.value',
		},
		confirm: {
			help: 'account.account.password.confirm.help',
			value: 'account.account.password.confirm.value',
		},
		new: {
			help: 'account.account.password.new.help',
			value: 'account.account.password.new.value',
		},
	},
	delete: {
		title: 'account.account.delete.title',
		sub_title: 'account.account.delete.sub_title',
		submit: 'account.account.delete.submit',
		cancel: 'account.account.delete.cancel',
		password: 'account.account.delete.password',
		confirm: {
			title: 'account.account.delete.confirm.title',
			sub_title: 'account.account.delete.confirm.sub_title',
		},
	},
	oauth: {
		title: 'account.account.oauth.title',
		sub_title: 'account.account.oauth.sub_title',
		connected: 'account.account.oauth.connected',
		not_connected: 'account.account.oauth.not_connected',
		link: 'account.account.oauth.link',
		unlink: {
			value: 'account.account.oauth.unlink.value',
			confirm: createI18nEntry('account.account.oauth.unlink.confirm', {
				provider: '{provider}',
			}),
		},
	},
	two_factor: {
		title: 'account.account.two_factor.title',
		sub_title: 'account.account.two_factor.sub_title',
		enable: 'account.account.two_factor.enable',
		enabled: 'account.account.two_factor.enabled',
		enabled_sub: 'account.account.two_factor.enabled_sub',
		scan: 'account.account.two_factor.scan',
		manual: 'account.account.two_factor.manual',
		apps: 'account.account.two_factor.apps',
		code: {
			value: 'account.account.two_factor.code.value',
			placeholder: 'account.account.two_factor.code.placeholder',
		},
		confirm: 'account.account.two_factor.confirm',
		cancel: 'account.account.two_factor.cancel',
		recovery: {
			title: 'account.account.two_factor.recovery.title',
			sub_title: 'account.account.two_factor.recovery.sub_title',
			info: 'account.account.two_factor.recovery.info',
			copy: 'account.account.two_factor.recovery.copy',
			download: 'account.account.two_factor.recovery.download',
		},
		disable: {
			sub_title: 'account.account.two_factor.disable.sub_title',
			warning: 'account.account.two_factor.disable.warning',
			password: 'account.account.two_factor.disable.password',
			code: 'account.account.two_factor.disable.code',
			confirm: 'account.account.two_factor.disable.confirm',
		},
	},
};

/**
 * Shape of the resolved translation payload for the account settings section.
 */
export type SettingsAccountTranslations = BuildPayloadResult<typeof ACCOUNT_MAPPING>;

/**
 * Builds the resolved translation payload for the account settings section.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The account settings `t` object with every UI string resolved.
 */
export function buildAccountPayload(i18n: I18nTranslator): SettingsAccountTranslations {
	return i18n.buildPayload(ACCOUNT_MAPPING);
}
