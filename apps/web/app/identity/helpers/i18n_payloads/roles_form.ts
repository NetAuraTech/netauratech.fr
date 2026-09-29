import { createI18nEntry } from '#core/contracts/i18n_translator';
import { nestTranslation, type TranslationNodes } from '#transport/core/helpers/translation_tree';
import { permissionCategoryKey } from '#transport/identity/helpers/permission_category';
import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the role create/edit form. The dynamic part of
 * the `permissions` node (per-permission entries and per-category labels) is
 * appended at build time, one entry per data-driven slug.
 */
export const ROLES_FORM_MAPPING = {
	title: {
		create: 'identity.admin.roles.create.title',
		edit: createI18nEntry('identity.admin.roles.edit.title', { name: '{name}' }),
	},
	name: {
		value: 'identity.admin.roles.form.name.value',
		placeholder: 'identity.admin.roles.form.name.placeholder',
	},
	slug: {
		value: 'identity.admin.roles.form.slug.value',
		placeholder: 'identity.admin.roles.form.slug.placeholder',
	},
	description: {
		value: 'identity.admin.roles.form.description.value',
		placeholder: 'identity.admin.roles.form.description.placeholder',
	},
	submit: 'identity.admin.roles.form.submit',
	actions: {
		list: 'identity.admin.roles.list.title',
	},
	permissions: {
		value: 'identity.admin.roles.form.permissions.value',
		system_hint: 'identity.admin.roles.form.permissions.system_hint',
	},
};

/**
 * Shape of the resolved translation payload for the role create/edit form:
 * the static keys plus the data-driven `permissions` node. Leaves of that node
 * are the raw stored values: system permissions store i18n keys
 * (`permissions.users.create.value`) resolved by the `permissions` lang
 * namespace, while custom permissions store plain strings which `i18n.t()`
 * returns unchanged.
 */
export type AdminRolesFormTranslations = BuildPayloadResult<typeof ROLES_FORM_MAPPING> & {
	permissions: TranslationNodes;
};

/**
 * Builds the translation payload for the role create/edit form.
 *
 * Includes per-permission entries nested by slug (`permissions.items.{...}`)
 * and per-category labels (`permissions.categories.{...}`) so the frontend can
 * group the checkboxes.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @param permissions - The permissions to build data-driven entries for.
 * @returns The role form `t` object with every UI string resolved.
 */
export function buildRolesFormPayload(
	i18n: I18nTranslator,
	permissions: ReadonlyArray<{ slug: string; name: string; description: string | null; category: string }>,
): AdminRolesFormTranslations {
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
		...ROLES_FORM_MAPPING,
		permissions: {
			...ROLES_FORM_MAPPING.permissions,
			categories,
			items,
		},
	});
}
