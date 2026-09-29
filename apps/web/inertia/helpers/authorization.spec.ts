import { type Data } from '@generated/data';
import { describe, expect, it } from 'vitest';
import {
	can,
	canAll,
	canAny,
	getPermissions,
	getRole,
	hasAllRoles,
	hasAnyRole,
	hasRawPermission,
	hasRawRole,
	hasRole,
} from '~/helpers/authorization';

/**
 * Behavioral seam for the frontend authorization helpers: the pure
 * check/getter functions consumed by the `useAuth` hook surface and the
 * `CanAccess` / `HasRole` guards. Slugs are typed against the system
 * permission/role catalog; the compile-time strictness of that union is
 * pinned by the `@ts-expect-error` assertions below, which the frontend
 * typecheck enforces.
 */

const userWith = (roleSlug: string, permissionSlugs: string[]): Data.Identity.User =>
	({
		id: 1,
		username: 'jane',
		email: 'jane@example.com',
		status: 'VERIFIED',
		emailVerifiedAt: null,
		createdAt: null,
		updatedAt: null,
		connectedProviders: { github: false, google: false, facebook: false },
		role: { id: 1, slug: roleSlug },
		permissions: permissionSlugs,
	}) as unknown as Data.Identity.User;

const admin = userWith('admin', ['users.view', 'users.create', 'roles.view']);
const guest = userWith('user', ['logs.view']);
/** A user whose role and permissions were created at runtime (not in the catalog). */
const custom = userWith('billing_manager', ['billing.export']);

describe('can', () => {
	it('returns true when the user holds the permission', () => {
		expect(can(admin, 'users.view')).toBe(true);
	});

	it('returns false when the user does not hold the permission', () => {
		expect(can(guest, 'users.view')).toBe(false);
	});

	it('returns false for an unauthenticated user', () => {
		expect(can(undefined, 'users.view')).toBe(false);
	});

	it('accepts any system permission slug from the catalog', () => {
		expect(can(guest, 'logs.view')).toBe(true);
		expect(can(admin, 'roles.view')).toBe(true);
	});

	it('rejects a misspelled slug at compile time', () => {
		// @ts-expect-error a slug outside the system catalog must not compile
		can(admin, 'users.creat');
		// @ts-expect-error a made-up slug must not compile
		can(admin, 'not.a.slug');
	});
});

describe('canAny', () => {
	it('returns true when the user holds at least one of the permissions', () => {
		expect(canAny(admin, ['roles.view', 'files.view'])).toBe(true);
	});

	it('returns false when the user holds none of the permissions', () => {
		expect(canAny(guest, ['users.view', 'files.view'])).toBe(false);
	});

	it('returns false for an unauthenticated user', () => {
		expect(canAny(undefined, ['users.view'])).toBe(false);
	});

	it('rejects an array containing a slug outside the catalog at compile time', () => {
		// @ts-expect-error a slug outside the system catalog must not compile
		canAny(admin, ['users.view', 'files.missing']);
	});
});

describe('canAll', () => {
	it('returns true when the user holds every permission', () => {
		expect(canAll(admin, ['users.view', 'users.create'])).toBe(true);
	});

	it('returns false when the user misses one of the permissions', () => {
		expect(canAll(admin, ['users.view', 'files.view'])).toBe(false);
	});

	it('returns false for an unauthenticated user', () => {
		expect(canAll(undefined, ['users.view'])).toBe(false);
	});
});

describe('hasRole', () => {
	it('returns true when the user role matches', () => {
		expect(hasRole(admin, 'admin')).toBe(true);
		expect(hasRole(guest, 'user')).toBe(true);
	});

	it('returns false when the user role does not match', () => {
		expect(hasRole(guest, 'admin')).toBe(false);
	});

	it('returns false for an unauthenticated user', () => {
		expect(hasRole(undefined, 'admin')).toBe(false);
	});

	it('rejects a role outside the system catalog at compile time', () => {
		// @ts-expect-error a role outside the system catalog must not compile
		hasRole(admin, 'moderator');
	});
});

describe('hasAnyRole', () => {
	it('returns true when the user role is among the slugs', () => {
		expect(hasAnyRole(guest, ['admin', 'user'])).toBe(true);
	});

	it('returns false for an unauthenticated user', () => {
		expect(hasAnyRole(undefined, ['admin', 'user'])).toBe(false);
	});

	it('rejects an array containing a role outside the catalog at compile time', () => {
		// @ts-expect-error a role outside the system catalog must not compile
		hasAnyRole(admin, ['admin', 'moderator']);
	});
});

describe('hasAllRoles', () => {
	it('returns true when every slug matches the user role', () => {
		expect(hasAllRoles(admin, ['admin', 'admin'])).toBe(true);
	});

	it('returns false when distinct slugs are given (a user holds one role)', () => {
		expect(hasAllRoles(admin, ['admin', 'user'])).toBe(false);
	});

	it('returns false for an unauthenticated user', () => {
		expect(hasAllRoles(undefined, ['admin'])).toBe(false);
	});
});

describe('hasRawPermission', () => {
	it('checks runtime custom permission slugs outside the catalog', () => {
		expect(hasRawPermission(custom, 'billing.export')).toBe(true);
		expect(hasRawPermission(admin, 'billing.export')).toBe(false);
	});

	it('accepts any plain string at compile time', () => {
		expect(hasRawPermission(guest, 'anything.at.all')).toBe(false);
	});

	it('returns false for an unauthenticated user', () => {
		expect(hasRawPermission(undefined, 'billing.export')).toBe(false);
	});
});

describe('hasRawRole', () => {
	it('checks runtime custom role slugs outside the catalog', () => {
		expect(hasRawRole(custom, 'billing_manager')).toBe(true);
		expect(hasRawRole(admin, 'billing_manager')).toBe(false);
	});

	it('accepts any plain string at compile time', () => {
		expect(hasRawRole(guest, 'anything.at.all')).toBe(false);
	});

	it('returns false for an unauthenticated user', () => {
		expect(hasRawRole(undefined, 'billing_manager')).toBe(false);
	});
});

describe('getPermissions', () => {
	it('returns the permission slugs held by the user', () => {
		expect(getPermissions(admin)).toEqual(['users.view', 'users.create', 'roles.view']);
	});

	it('returns an empty array for an unauthenticated user', () => {
		expect(getPermissions(undefined)).toEqual([]);
	});
});

describe('getRole', () => {
	it('returns the user role slug', () => {
		expect(getRole(admin)).toBe('admin');
		expect(getRole(custom)).toBe('billing_manager');
	});

	it('returns undefined for an unauthenticated user', () => {
		expect(getRole(undefined)).toBeUndefined();
	});
});
