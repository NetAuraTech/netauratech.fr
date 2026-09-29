/*
|--------------------------------------------------------------------------
| System Permission Catalog
|--------------------------------------------------------------------------
|
| The composed list of system permission slugs for this flavor. Every
| domain owns its own catalog const in its business layer (e.g.
| `src/identity/permissions.ts`); this file composes those per-domain
| catalogs into the single matrix the permission seeder persists.
| Adding or renaming a permission only touches that domain's catalog file.
|
| The `permissionCatalog` object also drives the `PermissionSlug` union of
| this flavor: the catalog is the single source of both the persisted slug
| values and the slug type.
|
| The composed catalog finally yields the `permissions` identity map — one
| group per category, one camelCase key per action, mapped to the raw slug
| string — which route guards, nav entries and ability checks reference
| instead of raw literals.
|
*/

import { corePermissionCatalog, coreRoleSlugs, maintenancePermissionCatalog } from '#core/permissions';
import { filePermissionCatalog } from '#file/permissions';
import { identityPermissionCatalog } from '#identity/permissions';
import { loggingPermissionCatalog } from '#log/permissions';
import type { PermissionSlugs, PermissionMap } from '#types/permissions';

/**
 * The composed system permission catalog of this flavor: `category →
 * actions` matrix ordered by domain (core, identity, file, maintenance,
 * logging). The permission seeder persists exactly this matrix, so it
 * is the single source of the persisted slugs.
 */
export const permissionCatalog = {
	...corePermissionCatalog,
	...identityPermissionCatalog,
	...filePermissionCatalog,
	...maintenancePermissionCatalog,
	...loggingPermissionCatalog,
};

/** Union of every system permission slug in this flavor. */
export type PermissionSlug = PermissionSlugs<typeof permissionCatalog>;

/**
 * The camelCase form of a snake_case permission action (`manage_roles` →
 * `manageRoles`); the runtime counterpart of the nested `permissions` keys.
 */
const actionKey = (action: string): string =>
	action.replace(/_([a-z])/g, (_separator, letter: string) => letter.toUpperCase());

/**
 * Builds the nested permission identity map from a composed permission
 * catalog.
 *
 * The generic signature carries the {@link PermissionMap} type through the
 * construction, so the map's shape is derived from the catalog's type
 * instead of being imposed by an `as unknown as` cast at the composition.
 * The single cast inside the loop is confined to the runtime key iteration —
 * the group is typed exactly as its target and filled exhaustively, one
 * entry per catalog action.
 *
 * @param catalog - The composed `category → actions` permission catalog.
 * @returns The nested `category → camelCase action → slug` identity map.
 */
function buildPermissionMap<Catalog extends Record<string, readonly string[]>>(
	catalog: Catalog,
): PermissionMap<Catalog> {
	const map = {} as PermissionMap<Catalog>;

	for (const category of Object.keys(catalog) as Array<keyof Catalog & string>) {
		const group = {} as PermissionMap<Catalog>[typeof category];

		for (const action of catalog[category]) {
			(group as Record<string, string>)[actionKey(action)] = `${category}.${action}`;
		}

		map[category] = group;
	}

	return map;
}

/**
 * The nested identity map of this flavor's permission slugs: one group per
 * catalog category (`permissions.users`, `permissions.pages`, ...) whose
 * keys are the camelCase form of the category's actions
 * (`permissions.users.view`, `permissions.users.manageRoles`, ...) mapped to
 * the raw slug string. Derived at runtime from the {@link permissionCatalog},
 * so renaming a slug in a domain catalog file renames its key here, and
 * every former `permissions.*` use site fails to compile until it is updated.
 */
export const permissions = buildPermissionMap(permissionCatalog);

/**
 * The system role slugs of this flavor; the role seeder persists exactly
 * this list, so it is the single source of the persisted role slugs.
 */
export const systemRoleSlugs = coreRoleSlugs;

/** Union of every system role slug in this flavor. */
export type SystemRoleSlug = (typeof systemRoleSlugs)[number];
