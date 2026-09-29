import { BaseTransformer } from '@adonisjs/core/transformers';
import type { Permission } from '#identity/domain/permission';

/**
 * Maps an identity {@link Permission} domain object to the API/Inertia
 * permission payload.
 */
export default class PermissionTransformer extends BaseTransformer<Permission> {
	/**
	 * Build the permission payload.
	 */
	toObject() {
		return {
			id: this.resource.id.value,
			name: this.resource.name,
			slug: this.resource.slug,
			description: this.resource.description,
			category: this.resource.category,
			isSystem: this.resource.isSystem,
			createdAt: this.resource.createdAt,
			updatedAt: this.resource.updatedAt,
		};
	}
}
