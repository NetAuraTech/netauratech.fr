import { createI18nEntry } from '#core/contracts/i18n_translator';
import { buildRoleEntries } from '#transport/identity/helpers/i18n_payloads/role_entries';
import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';
import type { RoleEntry } from '#identity/domain/role';
import type { TranslationNodes } from '#transport/core/helpers/translation_tree';

/**
 * The flat i18n key mapping for the user create/edit form. The `roles` node
 * is built dynamically at build time, one entry per data-driven slug.
 */
export const USERS_FORM_MAPPING = {
	title: {
		create: 'identity.admin.users.create.title',
		edit: createI18nEntry('identity.admin.users.edit.title', { username: '{username}' }),
	},
	email: {
		value: 'identity.admin.users.form.email.value',
		placeholder: 'identity.admin.users.form.email.placeholder',
	},
	username: {
		value: 'identity.admin.users.form.username.value',
		placeholder: 'identity.admin.users.form.username.placeholder',
	},
	roles: {
		value: 'identity.admin.users.form.role.value',
		placeholder: 'identity.admin.users.form.role.placeholder',
	},
	api_rate_limit: {
		value: 'identity.admin.users.form.api_rate_limit.value',
		placeholder: 'identity.admin.users.form.api_rate_limit.placeholder',
	},
	submit: 'identity.admin.users.form.submit',
	actions: {
		list: 'identity.admin.users.list.title',
	},
};

/**
 * Shape of the resolved translation payload for the user create/edit form:
 * the static keys plus the data-driven `roles` node.
 */
export type AdminUsersFormTranslations = BuildPayloadResult<typeof USERS_FORM_MAPPING> & {
	roles: TranslationNodes;
};

/**
 * Builds the translation payload for the user create/edit form.
 *
 * Includes dynamic per-role entries (name resolved through the shared `roles`
 * lang namespace, description stored raw) keyed by slug so the role selector
 * can render without extra fetches.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @param roles - The roles to build per-role entries for.
 * @returns The user form `t` object with every UI string resolved.
 */
export function buildUsersFormPayload(
	i18n: I18nTranslator,
	roles: ReadonlyArray<RoleEntry>,
): AdminUsersFormTranslations {
	return i18n.buildPayload({
		...USERS_FORM_MAPPING,
		roles: { ...USERS_FORM_MAPPING.roles, ...buildRoleEntries(roles) },
	});
}
