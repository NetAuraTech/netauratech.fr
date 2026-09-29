import vine from '@vinejs/vine';

/**
 * REST API id validator — accepts any positive number without an `exists`
 * lookup, so unknown ids reach the domain action and surface as a typed
 * `RowNotFoundException` (HTTP 404) instead of a Vine validation error (422).
 */
export const restIdValidator = vine.create({
	id: vine.number().positive(),
});
