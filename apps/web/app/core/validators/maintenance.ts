import vine from '@vinejs/vine';

export const updateMaintenanceValidator = vine.create({
	enabled: vine.boolean().optional(),
	message: vine.string().optional(),
	allowedIps: vine.array(vine.string()).optional(),
});

export const toggleMaintenanceValidator = vine.create({
	enabled: vine.boolean(),
	message: vine.string().optional(),
});
