import { createI18nEntry, type BuildPayloadResult, type I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the permission create/edit form.
 */
export const PERMISSIONS_FORM_MAPPING = {
	title: {
		create: 'identity.admin.permissions.create.title',
		edit: createI18nEntry('identity.admin.permissions.edit.title', { name: '{name}' }),
	},
	name: {
		value: 'identity.admin.permissions.form.name.value',
		placeholder: 'identity.admin.permissions.form.name.placeholder',
	},
	slug: {
		value: 'identity.admin.permissions.form.slug.value',
		placeholder: 'identity.admin.permissions.form.slug.placeholder',
	},
	category: {
		value: 'identity.admin.permissions.form.category.value',
		placeholder: 'identity.admin.permissions.form.category.placeholder',
	},
	description: {
		value: 'identity.admin.permissions.form.description.value',
		placeholder: 'identity.admin.permissions.form.description.placeholder',
	},
	submit: 'identity.admin.permissions.form.submit',
	actions: {
		list: 'identity.admin.permissions.list.title',
	},
};

/**
 * Shape of the resolved translation payload for the permission create/edit form.
 */
export type AdminPermissionsFormTranslations = BuildPayloadResult<typeof PERMISSIONS_FORM_MAPPING>;

/**
 * Builds the translation payload for the permission create/edit form.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The permission form `t` object with every UI string resolved.
 */
export function buildPermissionsFormPayload(i18n: I18nTranslator): AdminPermissionsFormTranslations {
	return i18n.buildPayload(PERMISSIONS_FORM_MAPPING);
}
