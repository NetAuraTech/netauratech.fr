import { test } from '@japa/runner';
import { PermissionIdentifier } from '#identity/domain/identifiers';
import { Permission } from '#identity/domain/permission';

const now = new Date('2026-01-01T00:00:00Z');

const model = (
	overrides: Partial<{
		id: number;
		slug: string;
		name: string;
		description: string | null;
		category: string;
		isSystem: boolean;
	}> = {},
) => ({
	id: overrides.id ?? 1,
	slug: overrides.slug ?? 'files.delete',
	name: overrides.name ?? 'Delete file',
	description: overrides.description ?? null,
	category: overrides.category ?? 'file',
	isSystem: overrides.isSystem ?? false,
	createdAt: now,
	updatedAt: now,
});

/**
 * Unit tests for the {@link Permission} domain object.
 */
test.group('Permission', () => {
	test('fromModel() hydrates the identity through a PermissionIdentifier', ({ assert }) => {
		const permission = Permission.fromModel(model({ id: 3, slug: 'files.delete', category: 'file' }));

		assert.isTrue(permission.id instanceof PermissionIdentifier);
		assert.equal(permission.id.value, 3);
		assert.equal(permission.slug, 'files.delete');
		assert.equal(permission.category, 'file');
		assert.isFalse(permission.isSystem);
	});

	test('system permissions are immutable and undeletable', ({ assert }) => {
		const permission = Permission.fromModel(model({ id: 1, slug: 'users.view', category: 'identity', isSystem: true }));

		assert.isFalse(permission.canBeModified());
		assert.isFalse(permission.canBeDeleted());
	});

	test('custom permissions may be modified and deleted', ({ assert }) => {
		const permission = Permission.fromModel(model({ id: 2, slug: 'custom.one', category: 'misc' }));

		assert.isTrue(permission.canBeModified());
		assert.isTrue(permission.canBeDeleted());
	});

	test('equals() compares identities, not fields', ({ assert }) => {
		const a = Permission.fromModel(model({ id: 1, slug: 'a', category: 'c' }));
		const b = Permission.fromModel(model({ id: 1, slug: 'other', category: 'other', isSystem: true }));
		const c = Permission.fromModel(model({ id: 2, slug: 'a', category: 'c' }));

		assert.isTrue(a.equals(b));
		assert.isFalse(a.equals(c));
	});
});
