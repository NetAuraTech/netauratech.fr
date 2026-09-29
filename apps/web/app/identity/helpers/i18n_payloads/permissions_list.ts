import { createI18nEntry } from '#core/contracts/i18n_translator';
import { nestTranslation, type TranslationNodes } from '#transport/core/helpers/translation_tree';
import { permissionCategoryKey } from '#transport/identity/helpers/permission_category';
import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the permissions listing page. The per-permission
 * `items` and per-category `categories` nodes are appended dynamically at build
 * time, one entry per data-driven slug.
 */
export const PERMISSIONS_LIST_MAPPING = {
	title: 'identity.admin.permissions.list.title',
	create: { title: 'identity.admin.permissions.create.title' },
	table: {
		name: 'identity.admin.permissions.table.name',
		slug: 'identity.admin.permissions.table.slug',
		description: 'identity.admin.permissions.table.description',
	},
	actions: {
		value: 'identity.admin.permissions.actions',
		edit: createI18nEntry('identity.admin.permissions.edit.title', { name: '{name}' }),
		delete: createI18nEntry('identity.admin.permissions.delete.title', { name: '{name}' }),
	},
	delete: {
		confirm: createI18nEntry('identity.admin.permissions.delete.confirm', { name: '{name}' }),
	},
	system: {
		value: 'identity.admin.permissions.system.value',
		hint: 'identity.admin.permissions.system.hint',
	},
	empty: 'identity.admin.permissions.empty',
};

/**
 * Shape of the resolved translation payload for the permissions listing page:
 * the static keys plus data-driven `categories` and `items` nodes. Leaves of the
 * dynamic nodes are the raw stored values — system permissions store i18n keys
 * resolved by the `permissions` lang namespace, custom permissions store plain
 * strings returned unchanged by `i18n.t()`.
 */
export type AdminPermissionsIndexTranslations = BuildPayloadResult<typeof PERMISSIONS_LIST_MAPPING> & {
	categories: TranslationNodes;
	items: TranslationNodes;
};

/**
 * Builds the translation payload for the permissions listing page.
 *
 * Includes per-permission entries nested by slug (`items.{...}`) and
 * per-category labels (`categories.{...}`) so the frontend can group by
 * category.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @param permissions - The permissions to build data-driven entries for.
 * @returns The permissions listing `t` object with every UI string resolved.
 */
export function buildPermissionsListPayload(
	i18n: I18nTranslator,
	permissions: ReadonlyArray<{ slug: string; name: string; description: string | null; category: string }>,
): AdminPermissionsIndexTranslations {
	const categories: TranslationNodes = {};
	const items: TranslationNodes = {};

	for (const permission of permissions) {
		nestTranslation(categories, permissionCategoryKey(permission.category), permission.category);
		nestTranslation(items, permission.slug, {
			value: permission.name,
			description: permission.description ?? '',
		});
	}

	return i18n.buildPayload({
		...PERMISSIONS_LIST_MAPPING,
		categories,
		items,
	});
}
