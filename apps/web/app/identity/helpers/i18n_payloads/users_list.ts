import { createI18nEntry } from '#core/contracts/i18n_translator';
import { buildRoleEntries } from '#transport/identity/helpers/i18n_payloads/role_entries';
import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';
import type { RoleEntry } from '#identity/domain/role';
import type { TranslationNodes } from '#transport/core/helpers/translation_tree';

/**
 * The flat i18n key mapping for the users listing page. The `roles` node is
 * built dynamically at build time, one entry per data-driven slug.
 */
export const USERS_LIST_MAPPING = {
	title: 'identity.admin.users.list.title',
	action: 'identity.admin.users.list.action',
	search: {
		value: 'identity.admin.users.search.value',
		placeholder: 'identity.admin.users.search.placeholder',
		filter: 'identity.admin.users.search.filter',
	},
	roles: {
		value: 'identity.admin.users.roles.value',
		placeholder: 'identity.admin.users.roles.placeholder',
	},
	status: {
		verified: 'identity.admin.users.status.verified',
		unverified: 'identity.admin.users.status.unverified',
		pending_invite: 'identity.admin.users.status.pending_invite',
		value: 'identity.admin.users.status.value',
	},
	empty: 'identity.admin.users.list.empty',
	register_on: 'identity.admin.users.list.register_on',
	value: 'identity.admin.users.value',
	value_one: 'identity.admin.users.value_one',
	actions: {
		value: 'identity.admin.users.actions',
		show: createI18nEntry('identity.admin.users.show.title', { username: '{username}' }),
		edit: createI18nEntry('identity.admin.users.edit.title', { username: '{username}' }),
		delete: createI18nEntry('identity.admin.users.delete.title', { username: '{username}' }),
	},
};

/**
 * Shape of the resolved translation payload for the users listing: the static
 * keys plus the data-driven `roles` node.
 */
export type AdminUsersIndexTranslations = BuildPayloadResult<typeof USERS_LIST_MAPPING> & {
	roles: TranslationNodes;
};

/**
 * Builds the translation payload for the users listing.
 *
 * Includes dynamic per-role entries (name resolved through the shared `roles`
 * lang namespace, description stored raw) keyed by slug.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @param roles - The roles to build per-role entries for.
 * @returns The users listing `t` object with every UI string resolved.
 */
export function buildUsersListPayload(
	i18n: I18nTranslator,
	roles: ReadonlyArray<RoleEntry>,
): AdminUsersIndexTranslations {
	return i18n.buildPayload({
		...USERS_LIST_MAPPING,
		roles: { ...USERS_LIST_MAPPING.roles, ...buildRoleEntries(roles) },
	});
}
