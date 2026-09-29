import vine from '@vinejs/vine';

/**
 * Validator for the `update_preferences` action on `POST /settings/preferences`.
 *
 * All fields are optional so the client can post a single preference
 * (e.g. only `theme`) without having to resend the full object.
 */
export const updateValidator = vine.create({
	theme: vine.enum(['light', 'dark'] as const).optional(),
	locale: vine.enum(['fr', 'en'] as const).optional(),
});
