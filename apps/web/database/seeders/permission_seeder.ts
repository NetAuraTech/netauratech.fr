import { BaseSeeder } from '@adonisjs/lucid/seeders';
import Permission from '#identity/models/permission';
import { permissionCatalog } from '#start/permissions';

export default class extends BaseSeeder {
	async run() {
		/**
		 * Flatten the composed permission catalog (single source of the
		 * persisted slugs) into permission rows, then upsert each permission
		 * into the database.
		 */
		const permissions = Object.entries(permissionCatalog as Record<string, readonly string[]>).flatMap(
			([category, actions]) =>
				actions.map((action) => ({
					name: `permissions.${category}.${action}.value`,
					slug: `${category}.${action}`,
					category: `permissions.category.${category}`,
					description: `permissions.${category}.${action}.description`,
					isSystem: true,
				})),
		);

		const createdPermissions = await Promise.all(
			permissions.map((permission) => {
				Permission.updateOrCreate({ slug: permission.slug }, permission);
			}),
		);

		console.log('✅ Permissions seeded successfully');
		console.log(`  - Created ${createdPermissions.length} permissions`);
	}
}
