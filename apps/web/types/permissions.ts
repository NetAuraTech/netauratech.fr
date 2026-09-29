/**
 * Shared typing helpers for the system permission catalog.
 *
 * Each domain owns a permission catalog const — a `category → actions`
 * matrix (`as const`) living in `{domain}_permissions.ts` next to its nav
 * module. The {@link PermissionSlugs} helper derives the `category.action`
 * slug union from such a const, so the slug values and the slug union always
 * come from the same declaration. The composed catalog of a flavor lives in
 * `start/permissions.ts` (a flavor-rewritable composition file).
 */

/**
 * The `category.action` slug union of a permission catalog const.
 *
 * @example
 * type UsersView = PermissionSlugs<{ readonly users: readonly ['view'] }>
 * // => 'users.view'
 */
export type PermissionSlugs<T> = {
	[Category in keyof T & string]: `${Category}.${T[Category] extends readonly string[] ? T[Category][number] : never}`;
}[keyof T & string];

/**
 * The camelCase form of a snake_case permission action (`manage_roles` →
 * `manageRoles`); the key shape of the nested `permissions` identity map.
 */
type ActionCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
	? `${Head}${Capitalize<ActionCamel<Tail & string>>}`
	: S;

/**
 * The nested key structure of the composed `permissions` identity map: one
 * group per catalog category, whose keys are the camelCase form of the
 * category's actions, each value typed as the raw `category.action` slug.
 *
 * @example
 * type M = PermissionMap<{ readonly users: readonly ['view', 'manage_roles'] }>
 * // => { readonly users: { readonly view: 'users.view'; readonly manageRoles: 'users.manage_roles' } }
 */
export type PermissionMap<T> = {
	[Category in keyof T & string]: {
		[
			Action in T[Category] extends readonly string[] ? T[Category][number] : never as ActionCamel<Action & string>
		]: `${Category}.${Action & string}`;
	};
};
