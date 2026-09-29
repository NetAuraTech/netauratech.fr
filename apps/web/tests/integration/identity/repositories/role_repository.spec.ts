import { test } from '@japa/runner';
import Role from '#identity/models/role';
import { RoleRepository } from '#identity/repositories/role_repository';

test.group('RoleRepository', () => {
	const repo = new RoleRepository();

	test('create() and findById() work together', async ({ assert }) => {
		const ts = Date.now();
		const role = await repo.create({
			name: `Test Role ${ts}`,
			slug: `test.role.${ts}`,
			isSystem: false,
			description: 'Desc',
		});
		const found = await repo.findById(role.id);
		assert.isNotNull(found);
		assert.equal(found!.slug, `test.role.${ts}`);
	});

	test('findAll() returns roles with optional limits', async ({ assert }) => {
		const ts = Date.now();
		await repo.create({ name: `All Role 1 ${ts}`, slug: `all.1.${ts}` });
		await repo.create({ name: `All Role 2 ${ts}`, slug: `all.2.${ts}` });

		const results = await repo.findAll({ limit: 1 });
		assert.lengthOf(results, 1);
	});

	test('findOne() and findMany() filter by criteria', async ({ assert }) => {
		const ts = Date.now();
		await repo.create({ name: `Crit Role 1 ${ts}`, slug: `crit.1.${ts}`, isSystem: true });
		await repo.create({ name: `Crit Role 2 ${ts}`, slug: `crit.2.${ts}`, isSystem: true });

		const one = await repo.findOne({ slug: `crit.1.${ts}` });
		assert.isNotNull(one);
		assert.equal(one!.name, `Crit Role 1 ${ts}`);

		const many = await repo.findMany({ isSystem: true }, { limit: 2 });
		// Ensure we get at least 2 since there might be others seeded
		assert.isAtLeast(many.length, 2);
	});

	test('findBySlug() and findByName()', async ({ assert }) => {
		const ts = Date.now();
		await repo.create({ name: `Find Role ${ts}`, slug: `find.role.${ts}` });

		const bySlug = await repo.findBySlug(`find.role.${ts}`);
		assert.isNotNull(bySlug);

		const byName = await repo.findByName(`Find Role ${ts}`);
		assert.isNotNull(byName);
	});

	test('update() modifies a role', async ({ assert }) => {
		const ts = Date.now();
		const role = await repo.create({ name: `Old Role ${ts}`, slug: `old.role.${ts}` });
		const updated = await repo.update(role.id, { name: `New Role ${ts}` });

		assert.isNotNull(updated);
		assert.equal(updated!.name, `New Role ${ts}`);
	});

	test('delete() removes a role', async ({ assert }) => {
		const ts = Date.now();
		const role = await repo.create({ name: `Delete Role ${ts}`, slug: `delete.role.${ts}` });
		const result = await repo.delete(role.id);
		assert.isTrue(result);

		const found = await repo.findById(role.id);
		assert.isNull(found);
	});

	test('exists(), count(), and slugExists()', async ({ assert }) => {
		const ts = Date.now();
		await repo.create({
			name: `Count Role ${ts}`,
			slug: `count.role.${ts}`,
			description: `test_desc_${ts}`,
		});

		assert.isTrue(await repo.exists({ slug: `count.role.${ts}` }));
		assert.isTrue(await repo.slugExists(`count.role.${ts}`));

		const c = await repo.count({ description: `test_desc_${ts}` });
		assert.isAbove(c, 0);
	});

	test('getUserRole() and getAdminRole() return expected seeded roles', async ({ assert }) => {
		// No seeders run in tests — ensure the default roles exist idempotently
		// instead of relying on data left by other suites.
		await Role.updateOrCreate(
			{ slug: 'user' },
			{
				name: 'roles.user.value',
				slug: 'user',
				description: 'roles.user.description',
				isSystem: true,
			},
		);
		await Role.updateOrCreate(
			{ slug: 'admin' },
			{
				name: 'roles.admin.value',
				slug: 'admin',
				description: 'roles.admin.description',
				isSystem: true,
			},
		);

		const userRole = await repo.getUserRole();
		assert.isNotNull(userRole);
		assert.equal(userRole!.slug, 'user');

		const adminRole = await repo.getAdminRole();
		assert.isNotNull(adminRole);
		assert.equal(adminRole!.slug, 'admin');
	});

	test('findByIdOrFail() throws on missing id', async ({ assert }) => {
		await assert.rejects(() => repo.findByIdOrFail(999999));
	});
});
