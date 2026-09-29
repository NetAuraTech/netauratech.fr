import { createI18nEntry, type BuildPayloadResult, type I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the admin files listing page, including the
 * upload dialog and the alt-text editor.
 */
export const FILES_INDEX_MAPPING = {
	title: 'file.admin.files.list.title',
	action: {
		folders: 'file.admin.files.list.action.folders',
		upload: 'file.admin.files.list.action.upload',
	},
	name: 'file.admin.files.form.name.value',
	type: 'file.admin.files.form.type.value',
	size: 'file.admin.files.form.size.value',
	uploaded_at: 'file.admin.files.form.uploaded_at.value',
	upload: {
		value: 'file.admin.files.upload.submit',
		help: 'file.admin.files.upload.help',
		remove: 'file.admin.files.upload.remove',
		max_size: createI18nEntry('file.admin.files.upload.max_size', { size: '{size}' }),
		try_again: 'file.admin.files.upload.try_again',
		error: {
			size: createI18nEntry('file.admin.files.upload.error.size', { max: '{max}' }),
		},
	},
	actions: {
		value: 'file.admin.files.actions',
		show: 'file.admin.files.show.title',
		delete: {
			value: createI18nEntry('file.admin.files.delete.title', { filename: '{filename}' }),
			confirm: 'file.admin.files.delete.confirm',
		},
	},
	folders: {
		all: 'file.admin.files.list.folders.all',
	},
	search: {
		filter: 'file.admin.files.search.filter',
		value: 'file.admin.files.search.value',
		placeholder: 'file.admin.files.search.placeholder',
		type: {
			value: 'file.admin.files.search.type.value',
			options: {
				placeholder: 'file.admin.files.search.type.options.placeholder',
				image: 'file.admin.files.search.type.options.image',
				video: 'file.admin.files.search.type.options.video',
				audio: 'file.admin.files.search.type.options.audio',
				pdf: 'file.admin.files.search.type.options.pdf',
			},
		},
	},
	alts: {
		title: 'file.admin.files.show.alts.title',
		add: 'file.admin.files.show.alts.add',
		edit: 'file.admin.files.show.alts.edit',
		empty: 'file.admin.files.show.alts.empty',
		close: 'file.admin.files.show.alts.close',
		delete: {
			value: 'file.admin.files.show.alts.delete.value',
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
 * Shape of the resolved translation payload for the admin files listing page.
 */
export type AdminFilesTranslations = BuildPayloadResult<typeof FILES_INDEX_MAPPING>;

/**
 * Builds the resolved translation payload for the admin files listing page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The files listing `t` object with every UI string resolved.
 */
export function buildFilesIndexPayload(i18n: I18nTranslator): AdminFilesTranslations {
	return i18n.buildPayload(FILES_INDEX_MAPPING);
}
