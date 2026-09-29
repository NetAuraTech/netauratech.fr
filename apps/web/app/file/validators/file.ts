import vine from '@vinejs/vine';

const altKey = () => vine.string().trim().maxLength(100);
const altLocale = () => vine.string().trim().maxLength(10);
const folderName = () => vine.string().trim().maxLength(255);

export const listFileValidator = vine.create({
	page: vine.number().optional(),
	folder_id: vine.number().positive().optional(),
	mime_type: vine.string().trim().maxLength(100).optional(),
	search: vine.string().trim().maxLength(255).optional(),
});

export const showFileValidator = vine.create({
	id: vine.number().positive(),
});

export const moveFileValidator = vine.create({
	folder_id: vine.number().positive().nullable().optional(),
});

export const upsertAltValidator = vine.create({
	locale: altLocale(),
	key: altKey(),
	value: vine.string().trim().maxLength(500),
});

export const deleteAltValidator = vine.create({
	locale: altLocale(),
	key: altKey(),
});

export const createFolderValidator = vine.create({
	name: folderName(),
	parentId: vine.number().positive().nullable().optional(),
});

export const updateFolderValidator = vine.create({
	id: vine.number().positive(),
	name: folderName(),
});
