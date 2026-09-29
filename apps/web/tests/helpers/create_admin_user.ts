import { DateTime } from 'luxon';
import { extractNameFromEmail } from '#identity/domain/user';
import Permission from '#identity/models/permission';
import Role from '#identity/models/role';
import User from '#identity/models/user';

export const MAINTENANCE_PERMISSIONS = ['settings.maintenance'] as const;

export const CMS_PERMISSIONS = [
	'pages.view',
	'pages.create',
	'pages.update',
	'templates.view',
	'templates.create',
	'templates.update',
	'templates.delete',
] as const;

/**
 * Creates an administrator user with a role granted `admin.access` and any
 * additional permissions passed via `permissionSlugs`, with a verified email.
 */
export async function createAdminUser(overrides: {
	email: string;
	password?: string;
	permissionSlugs?: ReadonlyArray<string>;
}) {
	const password = overrides.password ?? 'TestPassword123!';
	const permissionSlugs = overrides.permissionSlugs ?? [];

	const role = await Role.updateOrCreate(
		{ slug: 'admin' },
		{
			name: 'roles.admin.value',
			slug: 'admin',
			description: 'roles.admin.description',
			isSystem: true,
		},
	);

	const allSlugs = ['admin.access', ...permissionSlugs];
	const permissions = await Promise.all(
		allSlugs.map((slug) => {
			const category = slug.split('.')[0];
			return Permission.updateOrCreate(
				{ slug },
				{
					name: `permissions.${slug}.value`,
					slug,
					category: `permissions.category.${category}`,
					description: `permissions.${slug}.description`,
					isSystem: true,
				},
			);
		}),
	);

	await role.syncPermissions(permissions.map((permission) => permission.id));

	return User.create({
		username: extractNameFromEmail(overrides.email),
		email: overrides.email,
		password,
		roleId: role.id,
		emailVerifiedAt: DateTime.now(),
	});
}
