import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import Role from '#identity/models/role';
import User from '#identity/models/user';
import { createAdminUser } from '#tests/helpers/create_admin_user';
import { createVerifiedUser } from '#tests/helpers/create_verified_user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';
import { resetSharedState } from '#tests/helpers/shared_state';

/**
 * Admin REST API v1 — Users resource (`/api/v1/admin/users`).
 *
 * Functional coverage of the HTTP contract at the highest seam: CRUD happy
 * paths, 401 without a token, 403 without the required permission, 404 on
 * unknown ids, 422 with field-level errors on invalid payloads, and the
 * pagination shape on the list endpoint.
 *
 * The test environment enables both guards (`.env.test`), mirroring the
 * `full`/`inertia` flavor with the token guard opted in. Every request sends
 * `Accept: application/json` like a real API client.
 */
test.group('Admin REST API v1 — Users', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	// User creation sends the invitation mail synchronously through the
	// mail client — swap the binding so the suite never touches a real
	// transport.
	group.each.setup(() => {
		swapMailClient();
		return () => restoreMailClient();
	});
	group.each.teardown(() => limiter.clear());

	test('lists users as a paginated payload', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-list@example.com',
			permissionSlugs: ['users.view'],
		});
		const token = await User.accessTokens.create(admin);

		await createVerifiedUser({ email: 'alice-listed@example.com' });
		await createVerifiedUser({ email: 'bob-listed@example.com' });

		const res = await client
			.get('/api/v1/admin/users?page=1&perPage=2')
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(200);
		const body = res.body();
		assert.isArray(body.data);
		assert.isAtMost(body.data.length, 2);
		assert.exists(body.metadata);
		assert.exists(body.metadata.total);
		assert.equal(body.metadata.perPage, 2);
		assert.equal(body.metadata.currentPage, 1);
	});

	test('list filters by search term', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-search@example.com',
			permissionSlugs: ['users.view'],
		});
		const token = await User.accessTokens.create(admin);

		await createVerifiedUser({ email: 'searchable-unique@example.com' });

		const res = await client
			.get('/api/v1/admin/users?search=searchable-unique')
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(200);
		const emails = res.body().data.map((u: { email: string }) => u.email);
		assert.isTrue(emails.some((e: string) => e === 'searchable-unique@example.com'));
	});

	test('list returns 401 without a token', async ({ client }) => {
		const res = await client.get('/api/v1/admin/users').accept('json');

		res.assertStatus(401);
	});

	test('list returns 403 without the users.view permission', async ({ client }) => {
		const user = await createVerifiedUser({ email: 'noperm-list@example.com' });
		const token = await User.accessTokens.create(user);

		const res = await client.get('/api/v1/admin/users').accept('json').bearerToken(token.value!.release());

		res.assertStatus(403);
	});

	test('creates a user and returns it with a 201', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-create@example.com',
			permissionSlugs: ['users.create'],
		});
		const token = await User.accessTokens.create(admin);

		const role = await Role.create({
			name: 'Member',
			slug: 'member',
			description: 'A regular member',
			isSystem: false,
		});

		const res = await client
			.post('/api/v1/admin/users')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({
				email: 'created-user@example.com',
				username: 'created-user',
				role_id: String(role.id),
			});

		res.assertStatus(201);
		assert.equal(res.body().data.email, 'created-user@example.com');
		assert.equal(res.body().data.username, 'Created User');
	});

	test('create returns 422 on an invalid payload', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-create-invalid@example.com',
			permissionSlugs: ['users.create'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client
			.post('/api/v1/admin/users')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ username: 'no-email' });

		res.assertStatus(422);
	});

	test('create returns 403 without the users.create permission', async ({ client }) => {
		const user = await createVerifiedUser({ email: 'noperm-create@example.com' });
		const token = await User.accessTokens.create(user);

		const res = await client
			.post('/api/v1/admin/users')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ email: 'forbidden@example.com', username: 'forbidden' });

		res.assertStatus(403);
	});

	test('shows a user by id', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-show@example.com',
			permissionSlugs: ['users.view'],
		});
		const token = await User.accessTokens.create(admin);

		const target = await createVerifiedUser({ email: 'shown@example.com' });

		const res = await client.get(`/api/v1/admin/users/${target.id}`).accept('json').bearerToken(token.value!.release());

		res.assertStatus(200);
		assert.equal(res.body().data.id, target.id);
		assert.equal(res.body().data.email, target.email);
	});

	test('show returns 404 for an unknown id', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-show-404@example.com',
			permissionSlugs: ['users.view'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client.get('/api/v1/admin/users/999999').accept('json').bearerToken(token.value!.release());

		res.assertStatus(404);
	});

	test('updates a user', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-update@example.com',
			permissionSlugs: ['users.update'],
		});
		const token = await User.accessTokens.create(admin);

		const role = await Role.create({
			name: 'Member',
			slug: 'member',
			description: 'A regular member',
			isSystem: false,
		});
		const target = await createVerifiedUser({ email: 'before-update@example.com' });
		target.roleId = role.id;
		await target.save();

		const res = await client
			.put(`/api/v1/admin/users/${target.id}`)
			.accept('json')
			.bearerToken(token.value!.release())
			.json({
				email: 'after-update@example.com',
				username: 'after-update',
				role_id: String(role.id),
			});

		res.assertStatus(200);
		assert.equal(res.body().data.username, 'after-update');
	});

	test('update returns 404 for an unknown id', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-update-404@example.com',
			permissionSlugs: ['users.update'],
		});
		const token = await User.accessTokens.create(admin);

		const role = await Role.create({
			name: 'Member 404',
			slug: 'member-404',
			description: 'A regular member',
			isSystem: false,
		});

		const res = await client
			.put('/api/v1/admin/users/999999')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({
				email: 'none@example.com',
				username: 'none',
				role_id: String(role.id),
			});

		res.assertStatus(404);
	});

	test('update returns 422 on a duplicate email', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-update-dupe@example.com',
			permissionSlugs: ['users.update'],
		});
		const token = await User.accessTokens.create(admin);

		const role = await Role.create({
			name: 'Member Dupe',
			slug: 'member-dupe',
			description: 'A regular member',
			isSystem: false,
		});
		await createVerifiedUser({ email: 'taken@example.com' });
		const target = await createVerifiedUser({ email: 'before-dupe@example.com' });
		target.roleId = role.id;
		await target.save();

		const res = await client
			.put(`/api/v1/admin/users/${target.id}`)
			.accept('json')
			.bearerToken(token.value!.release())
			.json({
				email: 'taken@example.com',
				username: 'before-dupe',
				role_id: String(role.id),
			});

		res.assertStatus(422);
	});

	test('deletes a user', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-delete@example.com',
			permissionSlugs: ['users.delete'],
		});
		const token = await User.accessTokens.create(admin);

		const target = await createVerifiedUser({ email: 'deleted@example.com' });

		const res = await client
			.delete(`/api/v1/admin/users/${target.id}`)
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(204);
	});

	test('delete returns 404 for an unknown id', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-delete-404@example.com',
			permissionSlugs: ['users.delete'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client.delete('/api/v1/admin/users/999999').accept('json').bearerToken(token.value!.release());

		res.assertStatus(404);
	});

	test('delete returns 403 without the users.delete permission', async ({ client }) => {
		const user = await createVerifiedUser({ email: 'noperm-delete@example.com' });
		const token = await User.accessTokens.create(user);

		const target = await createVerifiedUser({ email: 'delete-target@example.com' });

		const res = await client
			.delete(`/api/v1/admin/users/${target.id}`)
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(403);
	});
});
