import { BaseSeeder } from '@adonisjs/lucid/seeders';
import Permission from '#identity/models/permission';
import Role from '#identity/models/role';
import { systemRoleSlugs } from '#start/permissions';

export default class extends BaseSeeder {
	async run() {
		/**
		 * The system role slugs (single source of the persisted slugs) from the
		 * composed permission catalog, flattened into role rows.
		 */
		const roles = systemRoleSlugs.map((slug) => ({
			name: `roles.${slug}.value`,
			slug,
			description: `roles.${slug}.description`,
			isSystem: true,
		}));

		const createdRoles = await Promise.all(roles.map((role) => Role.updateOrCreate({ slug: role.slug }, role)));

		const roleMap = Object.fromEntries(createdRoles.map((r) => [r.slug, r]));

		const permissions = await Permission.all();

		const ids = permissions.map((p) => p.id);

		await roleMap['admin'].syncPermissions(ids);
		await roleMap['user'].syncPermissions([]);

		await Promise.all(createdRoles.map((role) => role.load('permissions')));

		console.log('✅ Roles seeded successfully');
		console.log(`  - Created ${createdRoles.length} role(s):`);

		Object.entries(roleMap).forEach(([slug, role]) => {
			console.log(`  - Role "${slug}": permissions: ${role.permissions.length}`);
		});
	}
}
