import vine from '@vinejs/vine';
import { deleteAccountValidator } from '#transport/account/validators/account';
import { updateValidator as preferencesValidator } from '#transport/account/validators/preference';
import { profileValidator } from '#transport/account/validators/profile';
import { registerApiDoc, type JsonSchema } from '#transport/core/openapi/api_docs_registry';
import { dateTime, errorSchema, validationErrorSchema, dataEnvelope } from '#transport/core/openapi/schemas';
import { email, password } from '#transport/core/validators/rules';

/** The user payload, as shaped by `UserTransformer`. */
const userSchema: JsonSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		username: { type: 'string' },
		email: { type: 'string', format: 'email' },
		status: { type: 'string' },
		emailVerifiedAt: dateTime,
		createdAt: dateTime,
		updatedAt: dateTime,
		role: { type: 'object', nullable: true },
		permissions: { type: 'array', items: { type: 'string' } },
	},
};

/**
 * The `PUT /api/v1/account` body: dispatched on the `_action` discriminator
 * between the `updateEmailValidator` (`email`) and `updatePasswordValidator`
 * (`current_password` + `password`/`password_confirmation`) shapes. The
 * dynamic `unique` rules of the real validators do not contribute to the JSON
 * schema, so this mirror produces the same documented shape.
 */
const updateAccountBodyValidator = vine.create({
	_action: vine.enum(['update_email', 'update_password'] as const),
	email: email().optional(),
	current_password: password().optional(),
	password: password().optional(),
	password_confirmation: vine.string().optional(),
});

/**
 * Register the docs metadata of the account REST surface (profile, account,
 * theme preference) under their full route names.
 *
 * Called from `app/account/controllers/api/routes.ts` at import time,
 * alongside the routes they document, so the docs and the routes live or die
 * together. Request schemas are derived from the very same validators the
 * endpoints execute, keeping the documented shape in lockstep with the
 * enforced one.
 */
export function registerAccountApiDocs(): void {
	registerApiDoc('api.v1.account.profile.show', {
		summary: "Show the current user's profile",
		tags: ['Account'],
		security: [['apiToken']],
		responses: {
			'200': { description: 'The current user.', schema: dataEnvelope(userSchema) },
			'401': { description: 'No valid access token was presented.', schema: errorSchema },
		},
	});

	registerApiDoc('api.v1.account.profile.update', {
		summary: "Update the current user's username",
		tags: ['Account'],
		security: [['apiToken']],
		request: [{ validator: profileValidator(0), in: 'body' }],
		responses: {
			'200': { description: 'The updated user.', schema: dataEnvelope(userSchema) },
			'401': { description: 'No valid access token was presented.', schema: errorSchema },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});

	registerApiDoc('api.v1.account.account.update', {
		summary: "Update the current user's email or password",
		description:
			'Dispatched on the body `_action` discriminator: `update_email` (email) or `update_password` (current_password, password, password_confirmation).',
		tags: ['Account'],
		security: [['apiToken']],
		request: [{ validator: updateAccountBodyValidator, in: 'body' }],
		responses: {
			'200': { description: 'The updated user.', schema: dataEnvelope(userSchema) },
			'400': { description: 'The `_action` discriminator is missing or unknown.', schema: errorSchema },
			'401': { description: 'No valid access token was presented.', schema: errorSchema },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});

	registerApiDoc('api.v1.account.account.destroy', {
		summary: "Delete the current user's account",
		tags: ['Account'],
		security: [['apiToken']],
		request: [{ validator: deleteAccountValidator, in: 'body' }],
		responses: {
			'204': { description: 'The account was deleted.' },
			'401': { description: 'No valid access token was presented.', schema: errorSchema },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});

	registerApiDoc('api.v1.admin.account.preferences.execute', {
		summary: "Update the current user's preferences",
		description: 'Theme and/or locale preference; fields are optional so a single preference can be posted.',
		tags: ['Account'],
		request: [{ validator: preferencesValidator, in: 'body' }],
		responses: {
			'200': { description: 'A success message (translated string).', schema: { type: 'string' } },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});
}
