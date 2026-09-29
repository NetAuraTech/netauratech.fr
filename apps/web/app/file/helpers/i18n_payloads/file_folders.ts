import { createI18nEntry, type BuildPayloadResult, type I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the admin folders management page.
 */
export const FILE_FOLDERS_MAPPING = {
	title: 'file.admin.folders.list.title',
	action: 'file.admin.files.list.title',
	browse: 'file.admin.folders.list.browse',
	help: 'file.admin.folders.form.help',
	name: {
		root: 'file.admin.folders.form.name.root',
		sub: 'file.admin.folders.form.name.sub',
	},
	empty: {
		value: 'file.admin.folders.list.empty.value',
		help: 'file.admin.folders.list.empty.help',
	},
	actions: {
		add: 'file.admin.folders.list.add',
		create: 'file.admin.folders.form.create',
		update: 'file.admin.folders.form.update',
		cancel: 'file.admin.folders.form.cancel',
		rename: 'file.admin.folders.list.rename',
		delete: {
			value: createI18nEntry('file.admin.folders.delete.title', { folder: '{folder}' }),
			confirm: 'file.admin.folders.delete.confirm',
		},
	},
};

/**
 * Shape of the resolved translation payload for the admin folders management page.
 */
export type AdminFileFoldersTranslations = BuildPayloadResult<typeof FILE_FOLDERS_MAPPING>;

/**
 * Builds the resolved translation payload for the admin folders management page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The folders management `t` object with every UI string resolved.
 */
export function buildFileFoldersPayload(i18n: I18nTranslator): AdminFileFoldersTranslations {
	return i18n.buildPayload(FILE_FOLDERS_MAPPING);
}
