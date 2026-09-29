import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { DeleteUserAccountAction } from '#account/actions/account/delete_user_account_action';
import { UpdateUserAccountAction } from '#account/actions/account/update_user_account_action';
import InvalidActionException from '#account/exceptions/invalid_action_exception';
import {
	deleteAccountValidator,
	updateEmailValidator,
	updatePasswordValidator,
} from '#transport/account/validators/account';
import { type RestEndpoint, handle } from '#transport/core/rest/rest_adapter';
import { preloadUserRoleWithPermissions } from '#transport/identity/helpers/load_user_role';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import type User from '#identity/models/user';
import type { Infer } from '@vinejs/vine/types';

type AccountEmailPayload = Infer<ReturnType<typeof updateEmailValidator>>;
type AccountPasswordPayload = Infer<typeof updatePasswordValidator>;
type AccountDeletePayload = Infer<typeof deleteAccountValidator>;

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
