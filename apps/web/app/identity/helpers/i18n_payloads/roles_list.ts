import { createI18nEntry } from '#core/contracts/i18n_translator';
import { nestTranslation, type TranslationNodes } from '#transport/core/helpers/translation_tree';
import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';
import type { RoleEntry } from '#identity/domain/role';

/**
 * The flat i18n key mapping for the roles listing page. The `roles` node is
 * built dynamically at build time, one entry per data-driven slug.
 */
export const ROLES_LIST_MAPPING = {
	title: 'identity.admin.roles.list.title',
	search: {
		value: 'identity.admin.roles.search.value',
		placeholder: 'identity.admin.roles.search.placeholder',
		filter: 'identity.admin.roles.search.filter',
	},
	create: { title: 'identity.admin.roles.create.title' },
	table: {
		name: 'identity.admin.roles.table.name',
		slug: 'identity.admin.roles.table.slug',
		permissions: 'identity.admin.roles.table.permissions',
		users: 'identity.admin.roles.table.users',
	},
	actions: {
		value: 'identity.admin.roles.actions',
		show: createI18nEntry('identity.admin.roles.show.title', { name: '{name}' }),
		edit: createI18nEntry('identity.admin.roles.edit.title', { name: '{name}' }),
		delete: createI18nEntry('identity.admin.roles.delete.title', { name: '{name}' }),
	},
	delete: {
		confirm: createI18nEntry('identity.admin.roles.delete.confirm', { name: '{name}' }),
	},
	system: {
		value: 'identity.admin.roles.system.value',
		hint: 'identity.admin.roles.system.hint',
	},
	empty: 'identity.admin.roles.empty',
};

/**
 * Shape of the resolved translation payload for the roles listing: the static
 * keys plus the data-driven `roles` node. Leaves are the raw stored values:
 * system roles store i18n keys (`roles.admin.value`) resolved by the `roles`
 * lang namespace, while custom roles store plain strings which `i18n.t()`
 * returns unchanged.
 */
export type AdminRolesIndexTranslations = BuildPayloadResult<typeof ROLES_LIST_MAPPING> & {
	roles: TranslationNodes;
};

/**
 * Builds the translation payload for the roles listing page.
 *
 * Includes one `roles.{slug...}` entry per role (system or custom).
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @param roles - The roles to build per-role entries for.
 * @returns The roles listing `t` object with every UI string resolved.
 */
export function buildRolesListPayload(
	i18n: I18nTranslator,
	roles: ReadonlyArray<RoleEntry>,
): AdminRolesIndexTranslations {
	const roleEntries: TranslationNodes = {};

	for (const role of roles) {
		nestTranslation(roleEntries, role.slug, {
			value: role.name,
			description: role.description ?? '',
		});
	}

	return i18n.buildPayload({ ...ROLES_LIST_MAPPING, roles: roleEntries });
}
