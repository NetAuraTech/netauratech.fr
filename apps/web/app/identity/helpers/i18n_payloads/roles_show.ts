import { createI18nEntry } from '#core/contracts/i18n_translator';
import { nestTranslation, type TranslationNodes } from '#transport/core/helpers/translation_tree';
import { permissionCategoryKey } from '#transport/identity/helpers/permission_category';
import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';
import type { RoleEntry } from '#identity/domain/role';

/**
 * The flat i18n key mapping for the role detail page. The `roles` and
 * `permissions` nodes are built dynamically at build time, one entry per
 * data-driven slug.
 */
export const ROLES_SHOW_MAPPING = {
	title: createI18nEntry('identity.admin.roles.show.title', { name: '{name}' }),
	name: { value: 'identity.admin.roles.form.name.value' },
	slug: { value: 'identity.admin.roles.form.slug.value' },
	description: { value: 'identity.admin.roles.form.description.value' },
	system: {
		value: 'identity.admin.roles.system.value',
		hint: 'identity.admin.roles.system.hint',
	},
	users: {
		value: 'identity.admin.roles.users.value',
		empty: 'identity.admin.roles.users.empty',
		table: {
			username: 'identity.admin.roles.users.table.username',
			email: 'identity.admin.roles.users.table.email',
		},
		actions: 'identity.admin.roles.actions',
		show: createI18nEntry('identity.admin.users.show.title', { username: '{username}' }),
	},
	permissions: {
		value: 'identity.admin.roles.form.permissions.value',
	},
	actions: {
		list: 'identity.admin.roles.list.title',
		edit: createI18nEntry('identity.admin.roles.edit.title', { name: '{name}' }),
		delete: createI18nEntry('identity.admin.roles.delete.title', { name: '{name}' }),
	},
	delete: {
		confirm: createI18nEntry('identity.admin.roles.delete.confirm', { name: '{name}' }),
	},
};

/**
 * Shape of the resolved translation payload for the role detail page: the
 * static keys plus the data-driven `roles` and `permissions` nodes.
 */
export type AdminRolesShowTranslations = BuildPayloadResult<typeof ROLES_SHOW_MAPPING> & {
	roles: TranslationNodes;
	permissions: TranslationNodes;
};

/**
 * Builds the translation payload for the role detail page.
 *
 * Includes the role display name (`roles.{slug...}`), per-permission entries
 * nested by slug and per-category labels so the frontend can show the
 * permission matrix grouped by category. Leaves are the raw stored values —
 * system records store i18n keys resolved by the `roles` / `permissions` lang
 * namespaces, custom records store plain strings returned unchanged.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @param role - The role being displayed.
 * @param permissions - The permissions assigned to the role (grouped by category).
 * @returns The role detail `t` object with every UI string resolved.
 */
export function buildRolesShowPayload(
	i18n: I18nTranslator,
	role: RoleEntry,
	permissions: ReadonlyArray<{ slug: string; name: string; description: string | null; category: string }>,
): AdminRolesShowTranslations {
	const categories: TranslationNodes = {};
	const items: TranslationNodes = {};

	for (const permission of permissions) {
		nestTranslation(categories, permissionCategoryKey(permission.category), permission.category);
		nestTranslation(items, permission.slug, {
			value: permission.name,
			description: permission.description ?? '',
		});
	}

	const roleEntry: TranslationNodes = {};
	nestTranslation(roleEntry, role.slug, {
		value: role.name,
		description: role.description ?? '',
	});

	return i18n.buildPayload({
		...ROLES_SHOW_MAPPING,
		permissions: {
			...ROLES_SHOW_MAPPING.permissions,
			categories,
			items,
		},
		roles: roleEntry,
	});
}
