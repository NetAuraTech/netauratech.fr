import { BaseTransformer } from '@adonisjs/core/transformers';
import RoleTransformer from '#transport/identity/transformers/role_transformer';
import type { User } from '#identity/domain/user';

/**
 * Maps an identity {@link User} domain object to the API/Inertia user
 * payload: profile fields, OAuth connection flags, the resolved role, and
 * the flat list of permission slugs it grants.
 */
export default class UserTransformer extends BaseTransformer<User> {
	/**
	 * Build the user payload.
	 *
	 * `role` is `null` for a roleless user, and `permissions` degrades to an
	 * empty array whenever the role or its permissions are absent.
	 */
	toObject() {
		return {
			id: this.resource.id.value,
			username: this.resource.username,
			email: this.resource.email,
			apiRateLimit: this.resource.apiRateLimit,
			status: this.resource.status(),
			emailVerifiedAt: this.resource.emailVerifiedAt,
			createdAt: this.resource.createdAt,
			updatedAt: this.resource.updatedAt,
			connectedProviders: {
				github: this.resource.hasGithubId,
				google: this.resource.hasGoogleId,
				facebook: this.resource.hasFacebookId,
			},
			role: RoleTransformer.transform(this.resource.role),
			permissions: this.resource.role?.permissionSlugs() ?? [],
		};
	}
}
