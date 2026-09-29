/**
 * The stored category of a system permission is an i18n key
 * (`permissions.category.users`) while custom permissions store a plain
 * category name. Strips the system prefix so both forms share the same
 * grouping key on the frontend.
 */
export function permissionCategoryKey(raw: string): string {
	const prefix = 'permissions.category.';
	return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
}
