import { BaseTransformer } from '@adonisjs/core/transformers';
import PermissionTransformer from '#transport/identity/transformers/permission_transformer';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import type { Role } from '#identity/domain/role';

/**
 * Maps an identity {@link Role} domain object to the API/Inertia role
 * payload. The `permissions` and `users` relations are included only when
 * they were preloaded, keeping list endpoints lean.
 */
export default class RoleTransformer extends BaseTransformer<Role> {
	/**
	 * Build the role payload.
	 *
	 * `permissions` and `users` stay `undefined` unless the corresponding
	 * relation was preloaded; `usersCount` is surfaced when the aggregate
	 * column was selected.
	 */
	toObject() {
		return {
			id: this.resource.id.value,
			name: this.resource.name,
			slug: this.resource.slug,
			description: this.resource.description,
			isSystem: this.resource.isSystem,
			createdAt: this.resource.createdAt,
			updatedAt: this.resource.updatedAt,
			permissions: this.resource.permissions
				? PermissionTransformer.transform([...this.resource.permissions])
				: undefined,
			users: this.resource.users ? UserTransformer.transform([...this.resource.users]) : undefined,
			usersCount: this.resource.usersCount ?? undefined,
		};
	}
}
