import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import vine from '@vinejs/vine';
import { DeleteUserAccountAction } from '#account/actions/account/delete_user_account_action';
import { UpdateUserAccountAction } from '#account/actions/account/update_user_account_action';
import InvalidActionException from '#account/exceptions/invalid_action_exception';
import {
	deleteAccountValidator,
	updateEmailValidator,
	updatePasswordValidator,
} from '#transport/account/validators/account';
import { type ApiOperationDoc, type JsonSchema } from '#transport/core/openapi/api_docs_registry';
import { dateTime, dataEnvelope, errorSchema, validationErrorSchema } from '#transport/core/openapi/schemas';
import { type RestEndpoint, handle } from '#transport/core/rest/rest_adapter';
import { email, password } from '#transport/core/validators/rules';
import { preloadUserRoleWithPermissions } from '#transport/identity/helpers/load_user_role';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import type User from '#identity/models/user';
import type { Infer } from '@vinejs/vine/types';

type AccountEmailPayload = Infer<ReturnType<typeof updateEmailValidator>>;
type AccountPasswordPayload = Infer<typeof updatePasswordValidator>;
type AccountDeletePayload = Infer<typeof deleteAccountValidator>;

export const userSchema: JsonSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		username: { type: 'string' },
		email: { type: 'string', format: 'email' },
		apiRateLimit: { type: 'number', nullable: true },
		status: { type: 'string' },
		emailVerifiedAt: dateTime,
		createdAt: dateTime,
		updatedAt: dateTime,
		connectedProviders: {
			type: 'object',
			properties: {
				github: { type: 'boolean' },
				google: { type: 'boolean' },
				facebook: { type: 'boolean' },
			},
		},
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

export const accountApiDocs: Record<'update' | 'destroy', ApiOperationDoc> = {
	update: {
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
	},
	destroy: {
		summary: "Delete the current user's account",
		tags: ['Account'],
		security: [['apiToken']],
		request: [{ validator: deleteAccountValidator, in: 'body' }],
		responses: {
			'204': { description: 'The account was deleted.' },
			'401': { description: 'No valid access token was presented.', schema: errorSchema },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	},
};

/**
 * Endpoint declarations for the account REST resource.
 */
export interface AccountEndpoints {
	updateEmail: RestEndpoint<{ user: User }, AccountEmailPayload, User, User>;
	updatePassword: RestEndpoint<{ user: User }, AccountPasswordPayload, User, User>;
	destroy: RestEndpoint<{ user: User }, AccountDeletePayload, boolean, void>;
}

/**
 * Reload the current user after a mutation and restore the role/permissions
 * preload the {@link UserTransformer} contract relies on.
 */
async function refetchProfile(user: User): Promise<User> {
	await user.refresh();

	await preloadUserRoleWithPermissions(user);

	return user;
}

/**
 * Declarative account REST resource.
 *
 * Owns the `/api/v1/account` (self) endpoint declarations consumed by the
 * REST `handle` adapter (`#transport/core/rest/rest_adapter`); the controllers reduce to
 * thin dispatchers over `endpoints`. The single `update` route is dispatched
 * on its `_action` body discriminator through {@link handleUpdate}.
 */
@inject()
export default class AccountResource {
	constructor(
		protected updateUserAccountAction: UpdateUserAccountAction,
		protected deleteUserAccountAction: DeleteUserAccountAction,
	) {}

	readonly endpoints: AccountEndpoints = {
		updateEmail: {
			prepare: async (context) => ({ user: context.auth.getUserOrFail() }),
			validator: (prepared) => updateEmailValidator(prepared.user.id),
			execute: (_context, prepared, payload) =>
				this.updateUserAccountAction.execute({ user: prepared.user, email: payload.email }),
			refetch: (_context, prepared) => refetchProfile(prepared.user),
			transform: (entity) => UserTransformer.transform(entity.toDomain()),
		},
		updatePassword: {
			prepare: async (context) => ({ user: context.auth.getUserOrFail() }),
			validator: () => updatePasswordValidator,
			execute: (_context, prepared, payload) =>
				this.updateUserAccountAction.execute({
					user: prepared.user,
					currentPassword: payload.current_password,
					password: payload.password,
				}),
			refetch: (_context, prepared) => refetchProfile(prepared.user),
			transform: (entity) => UserTransformer.transform(entity.toDomain()),
		},
		destroy: {
			docs: accountApiDocs.destroy,
			status: 204,
			prepare: async (context) => ({ user: context.auth.getUserOrFail() }),
			validator: () => deleteAccountValidator,
			execute: (_context, prepared, payload) =>
				this.deleteUserAccountAction.execute({ user: prepared.user, password: payload.password }),
		},
	};

	/**
	 * Dispatch the `update` route on its `_action` body discriminator.
	 *
	 * Unknown or missing discriminators fail with `E_INVALID_ACTION` (400),
	 * exactly like the pre-migration controller.
	 */
	async handleUpdate(ctx: HttpContext): Promise<unknown> {
		const action = ctx.request.input('_action');

		if (action === 'update_email') {
			return handle(ctx, this.endpoints.updateEmail);
		}

		if (action === 'update_password') {
			return handle(ctx, this.endpoints.updatePassword);
		}

		throw new InvalidActionException();
	}
}
