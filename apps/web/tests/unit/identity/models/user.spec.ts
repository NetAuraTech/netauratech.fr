import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import Token from '#auth/models/token';
import Permission from '#identity/models/permission';
import Role from '#identity/models/role';
import User from '#identity/models/user';

test.group('User Model', () => {
	test('isEmailVerified returns true if emailVerifiedAt is set', ({ assert }) => {
		const user = new User();
		assert.isFalse(user.isEmailVerified);

		user.emailVerifiedAt = DateTime.now();
		assert.isTrue(user.isEmailVerified);
	});

	test('status computed property handles unverified, verified, and pending invite states', async ({ assert }) => {
		const user = new User();

		// Default
		assert.equal(user.status, 'UNVERIFIED');

		// Verified
		user.emailVerifiedAt = DateTime.now();
		assert.equal(user.status, 'VERIFIED');

		// Pending invite
		user.emailVerifiedAt = null;
		user.hasPendingInvite = true;
		assert.equal(user.status, TOKEN_TYPES.PENDING_INVITE);
	});

	test('loadPendingInvite sets hasPendingInvite to true if token exists and user is unverified', async ({ assert }) => {
		const user = await User.create({
			email: 'invite@example.com',
			username: 'invite',
			password: 'pwd',
		});

		// Create a valid (non-expired) pending invite token
		await Token.create({
			userId: user.id,
			type: TOKEN_TYPES.PENDING_INVITE,
			token: 'abc',
			expiresAt: DateTime.now().plus({ days: 1 }),
		});

		await User.loadPendingInvite(user);
		assert.isTrue(user.hasPendingInvite);

		// Verify user
		user.emailVerifiedAt = DateTime.now();
		await User.loadPendingInvite(user);
		assert.isFalse(user.hasPendingInvite, 'Should be false if user is verified even if token exists');
	});

	test('loadPendingInviteAll batch-loads pending invites with a single query', async ({ assert }) => {
		// Create 5 users
		const users = await Promise.all(
			Array.from({ length: 5 }, (_, i) =>
				User.create({ email: `batch${i}@example.com`, username: `batch${i}`, password: 'pwd' }),
			),
		);

		// Give only users 0, 2, 4 a valid (non-expired) pending invite token
		await Token.create({
			userId: users[0].id,
			type: TOKEN_TYPES.PENDING_INVITE,
			token: 't1',
			expiresAt: DateTime.now().plus({ days: 1 }),
		});
		await Token.create({
			userId: users[2].id,
			type: TOKEN_TYPES.PENDING_INVITE,
			token: 't2',
			expiresAt: DateTime.now().plus({ days: 1 }),
		});
		await Token.create({
			userId: users[4].id,
			type: TOKEN_TYPES.PENDING_INVITE,
			token: 't3',
			expiresAt: DateTime.now().plus({ days: 1 }),
		});

		// Mark user 0 as verified — should NOT have hasPendingInvite = true
		users[0].emailVerifiedAt = DateTime.now();

		await User.loadPendingInviteAll(users);

		// Assert correct flags:
		// User 0: has token BUT verified → false
		// User 1: no token → false
		// User 2: has token, not verified → true
		// User 3: no token → false
		// User 4: has token, not verified → true
		assert.isFalse(users[0].hasPendingInvite, 'Verified user should be false despite token');
		assert.isFalse(users[1].hasPendingInvite, 'No token → false');
		assert.isTrue(users[2].hasPendingInvite, 'Has token + unverified → true');
		assert.isFalse(users[3].hasPendingInvite, 'No token → false');
		assert.isTrue(users[4].hasPendingInvite, 'Has token + unverified → true');
	});

	test('loadPendingInviteAll handles empty user list', async ({ assert }) => {
		await User.loadPendingInviteAll([]);
		assert.isTrue(true, 'No error on empty list');
	});

	test('loadPendingInvite ignores expired tokens', async ({ assert }) => {
		const user = await User.create({
			email: 'expired@example.com',
			username: 'expired',
			password: 'pwd',
		});

		// Create a pending invite token that is already expired
		await Token.create({
			userId: user.id,
			type: TOKEN_TYPES.PENDING_INVITE,
			token: 'abc',
			expiresAt: DateTime.now().minus({ days: 1 }),
		});

		await User.loadPendingInvite(user);
		assert.isFalse(user.hasPendingInvite, 'Expired token should not count as pending invite');
	});

	test('loadPendingInviteAll ignores expired tokens in batch', async ({ assert }) => {
		const users = await Promise.all(
			Array.from({ length: 3 }, (_, i) =>
				User.create({ email: `exp${i}@example.com`, username: `exp${i}`, password: 'pwd' }),
			),
		);

		// User 0: valid (non-expired) token
		await Token.create({
			userId: users[0].id,
			type: TOKEN_TYPES.PENDING_INVITE,
			token: 'valid',
			expiresAt: DateTime.now().plus({ days: 1 }),
		});

		// User 1: expired token
		await Token.create({
			userId: users[1].id,
			type: TOKEN_TYPES.PENDING_INVITE,
			token: 'expired',
			expiresAt: DateTime.now().minus({ days: 1 }),
		});

		// User 2: no token at all

		await User.loadPendingInviteAll(users);

		assert.isTrue(users[0].hasPendingInvite, 'Valid non-expired token → true');
		assert.isFalse(users[1].hasPendingInvite, 'Expired token → false');
		assert.isFalse(users[2].hasPendingInvite, 'No token → false');
	});

	test('can() returns true if user role has the permission', async ({ assert }) => {
		const role = await Role.create({ slug: 'test_role_can', name: 'Test Role Can' });
		const perm = await Permission.create({
			slug: 'do_action',
			name: 'Do Action Can',
			category: 'test',
		});
		await role.assignPermission(perm.id);

		const user = await User.create({
			email: 'can@example.com',
			username: 'can',
			password: 'pwd',
			roleId: role.id,
		});

		assert.isTrue(await user.can('do_action'));
		assert.isFalse(await user.can('other_action'));
	});

	test('can() returns false if user has no role', async ({ assert }) => {
		const user = await User.create({
			email: 'norole@example.com',
			username: 'norole',
			password: 'pwd',
		});
		assert.isFalse(await user.can('do_action'));
	});

	test('hasAnyRole() returns true if user role is in the list', async ({ assert }) => {
		const role = await Role.create({ slug: 'test_role_has', name: 'Test Role Has' });
		const user = await User.create({
			email: 'has@example.com',
			username: 'has',
			password: 'pwd',
			roleId: role.id,
		});

		assert.isTrue(await user.hasAnyRole(['admin', 'test_role_has']));
		assert.isFalse(await user.hasAnyRole(['admin', 'editor']));
	});

	test('hasAnyRole() returns false if user has no role', async ({ assert }) => {
		const user = await User.create({
			email: 'norole2@example.com',
			username: 'norole2',
			password: 'pwd',
		});
		assert.isFalse(await user.hasAnyRole(['admin']));
	});

	test('can() caches the role on the instance so repeated calls do not re-query', async ({ assert }) => {
		const role = await Role.create({ slug: 'test_role_cache', name: 'Test Role Cache' });
		const perm = await Permission.create({
			slug: 'cached_action',
			name: 'Cached Action',
			category: 'test',
		});
		await role.assignPermission(perm.id);

		const user = await User.create({
			email: 'cache@example.com',
			username: 'cache',
			password: 'pwd',
			roleId: role.id,
		});

		// First call loads the role from DB
		const result1 = await user.can('cached_action');
		assert.isTrue(result1);

		// Second call should use the cached role — same result, no extra query
		const result2 = await user.can('cached_action');
		assert.isTrue(result2);

		// A different slug on the same cached role should also work without re-querying
		assert.isFalse(await user.can('non_existent_slug'));
	});

	test('checkAny() returns true if the user has any of the given permissions', async ({ assert }) => {
		const role = await Role.create({ slug: 'test_role_checkany', name: 'Test Role CheckAny' });
		const perm1 = await Permission.create({
			slug: 'action_one',
			name: 'Action One',
			category: 'test',
		});
		const perm2 = await Permission.create({
			slug: 'action_two',
			name: 'Action Two',
			category: 'test',
		});
		await role.assignPermission(perm1.id);
		await role.assignPermission(perm2.id);

		const user = await User.create({
			email: 'checkany@example.com',
			username: 'checkany',
			password: 'pwd',
			roleId: role.id,
		});

		assert.isTrue(await user.checkAny(['action_one']));
		assert.isTrue(await user.checkAny(['action_two']));
		assert.isTrue(await user.checkAny(['action_one', 'action_two']));
		// Has at least one of the two
		assert.isTrue(await user.checkAny(['action_one', 'non_existent']));
		assert.isFalse(await user.checkAny(['non_existent_a', 'non_existent_b']));
	});

	test('checkAny() returns false if user has no role', async ({ assert }) => {
		const user = await User.create({
			email: 'norole3@example.com',
			username: 'norole3',
			password: 'pwd',
		});
		assert.isFalse(await user.checkAny(['do_action']));
	});

	test('checkAny() shares the role cache with can()', async ({ assert }) => {
		const role = await Role.create({ slug: 'test_role_shared_cache', name: 'Test Shared Cache' });
		const perm = await Permission.create({
			slug: 'shared_action',
			name: 'Shared Action',
			category: 'test',
		});
		await role.assignPermission(perm.id);

		const user = await User.create({
			email: 'shared@example.com',
			username: 'shared',
			password: 'pwd',
			roleId: role.id,
		});

		// checkAny loads and caches the role
		assert.isTrue(await user.checkAny(['shared_action']));

		// can() should reuse the cached role (no extra query)
		assert.isTrue(await user.can('shared_action'));
		assert.isFalse(await user.can('other_action'));
	});
});
