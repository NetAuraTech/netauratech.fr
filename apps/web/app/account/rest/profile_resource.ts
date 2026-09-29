import { inject } from '@adonisjs/core';
import { UpdateUserProfileAction } from '#account/actions/profile/update_user_profile_action';
import { profileValidator } from '#transport/account/validators/profile';
import { type RestEndpoint } from '#transport/core/rest/rest_adapter';
import { preloadUserRoleWithPermissions } from '#transport/identity/helpers/load_user_role';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import type User from '#identity/models/user';
import type { Infer } from '@vinejs/vine/types';

type ProfileUpdatePayload = Infer<ReturnType<typeof profileValidator>>;

/**
 * Endpoint declarations for the profile REST resource.
 */
export interface ProfileEndpoints {
	show: RestEndpoint<User, unknown, User, User>;
	update: RestEndpoint<{ user: User }, ProfileUpdatePayload, User, User>;
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
 * Declarative profile REST resource.
 *
 * Owns the `/api/v1/profile` (self) endpoint declarations consumed by the
 * REST `handle` adapter (`#transport/core/rest/rest_adapter`); the controllers reduce to
 * one-line dispatch over `endpoints`.
 */
@inject()
export default class ProfileResource {
	constructor(protected updateUserProfileAction: UpdateUserProfileAction) {}

	readonly endpoints: ProfileEndpoints = {
		show: {
			prepare: async (context) => {
				const user = context.auth.getUserOrFail();

				await preloadUserRoleWithPermissions(user);

				return user;
			},
			execute: async (_context, prepared) => prepared,
			transform: (entity) => UserTransformer.transform(entity.toDomain()),
		},
		update: {
			prepare: async (context) => ({ user: context.auth.getUserOrFail() }),
			validator: (prepared) => profileValidator(prepared.user.id),
			execute: (_context, prepared, payload) =>
				this.updateUserProfileAction.execute({
					user: prepared.user,
					username: payload.username,
				}),
			refetch: (_context, prepared) => refetchProfile(prepared.user),
			transform: (entity) => UserTransformer.transform(entity.toDomain()),
		},
	};
}
