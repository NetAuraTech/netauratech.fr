import { createI18nEntry, type BuildPayloadResult, type I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the admin file detail page, including the
 * alt-text editor.
 */
export const FILES_SHOW_MAPPING = {
	title: createI18nEntry('file.admin.files.show.title', { name: '{name}' }),
	actions: {
		back: 'file.admin.files.list.title',
		delete: {
			value: createI18nEntry('file.admin.files.delete.title', { name: '{name}' }),
			confirm: 'file.admin.files.delete.confirm',
		},
	},
	info: {
		name: 'file.admin.files.show.info.name',
		type: 'file.admin.files.show.info.type',
		size: 'file.admin.files.show.info.size',
		uploaded_at: 'file.admin.files.show.info.uploaded_at',
		value: 'file.admin.files.show.info.value',
	},
	alts: {
		value: 'file.admin.files.show.alts.value',
		add: 'file.admin.files.show.alts.add',
		delete: {
			confirm: 'file.admin.files.show.alts.delete.confirm',
		},
		form: {
			update: 'file.admin.files.show.alts.form.update',
			submit: 'file.admin.files.show.alts.form.submit',
			cancel: 'file.admin.files.show.alts.form.cancel',
			locale: {
				value: 'file.admin.files.show.alts.form.locale.value',
			},
			key: {
				value: 'file.admin.files.show.alts.form.key.value',
				placeholder: 'file.admin.files.show.alts.form.key.placeholder',
			},
			alt_text: {
				value: 'file.admin.files.show.alts.form.alt_text.value',
				placeholder: 'file.admin.files.show.alts.form.alt_text.placeholder',
			},
		},
	},
};

/**
 * Shape of the resolved translation payload for the admin file detail page.
 */
export type AdminFilesShowTranslations = BuildPayloadResult<typeof FILES_SHOW_MAPPING>;

/**
 * Builds the resolved translation payload for the admin file detail page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The file detail `t` object with every UI string resolved.
 */
export function buildFilesShowPayload(i18n: I18nTranslator): AdminFilesShowTranslations {
	return i18n.buildPayload(FILES_SHOW_MAPPING);
}
