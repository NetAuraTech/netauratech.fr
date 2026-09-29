import { test } from '@japa/runner';
import { UserIdentifier } from '#identity/domain/identifiers';
import { User, UserStatus, extractNameFromEmail, generateUniqueUsername } from '#identity/domain/user';

/**
 * Unit tests for the {@link User} domain object and the username derivation
 * helpers.
 */
test.group('User', () => {
	test('fromModel() hydrates the identity through a UserIdentifier', ({ assert }) => {
		const user = User.fromModel({ id: 9, username: 'jane', email: 'jane@example.com' });

		assert.isTrue(user.id instanceof UserIdentifier);
		assert.equal(user.id.value, 9);
		assert.equal(user.username, 'jane');
		assert.equal(user.email, 'jane@example.com');
	});

	test('status() derives PENDING_INVITE from a pending invite token', ({ assert }) => {
		const user = User.fromModel({ id: 1, username: 'u', email: 'u@example.com', hasPendingInvite: true });

		assert.equal(user.status(), 'PENDING_INVITE');
	});

	test('status() derives VERIFIED for a verified email without pending invite', ({ assert }) => {
		const user = User.fromModel({
			id: 1,
			username: 'u',
			email: 'u@example.com',
			hasPendingInvite: false,
			isEmailVerified: true,
		});

		assert.equal(user.status(), 'VERIFIED');
	});

	test('status() derives UNVERIFIED for everything else', ({ assert }) => {
		const user = User.fromModel({ id: 1, username: 'u', email: 'u@example.com', hasPendingInvite: false });

		assert.equal(user.status(), 'UNVERIFIED');
	});

	test('fromModel() derives isEmailVerified from emailVerifiedAt when not supplied', ({ assert }) => {
		const verified = User.fromModel({
			id: 1,
			username: 'u',
			email: 'u@example.com',
			emailVerifiedAt: new Date(),
		});
		const unverified = User.fromModel({ id: 1, username: 'u', email: 'u@example.com', emailVerifiedAt: null });

		assert.equal(verified.status(), 'VERIFIED');
		assert.equal(unverified.status(), 'UNVERIFIED');
	});

	test('equals() compares identities, not fields', ({ assert }) => {
		const a = User.fromModel({ id: 1, username: 'a', email: 'a@example.com' });
		const b = User.fromModel({ id: 1, username: 'other', email: 'other@example.com' });
		const c = User.fromModel({ id: 2, username: 'a', email: 'a@example.com' });

		assert.isTrue(a.equals(b));
		assert.isFalse(a.equals(c));
	});

	test('UserStatus.derive() follows the priority order', ({ assert }) => {
		assert.equal(UserStatus.derive(true, true), 'PENDING_INVITE');
		assert.equal(UserStatus.derive(false, true), 'VERIFIED');
		assert.equal(UserStatus.derive(false, false), 'UNVERIFIED');
	});

	test('extractNameFromEmail() title-cases the sanitised local part', ({ assert }) => {
		assert.equal(extractNameFromEmail('john.doe@example.com'), 'John Doe');
		assert.equal(extractNameFromEmail('jane_smith42@example.com'), 'Jane Smith');
		assert.equal(extractNameFromEmail('user+tag@example.com'), 'User Tag');
	});

	test('generateUniqueUsername() appends a numeric suffix while the base is taken', async ({ assert }) => {
		const taken = new Set(['johndoe', 'johndoe1']);
		const exists = async (username: string) => taken.has(username);

		assert.equal(await generateUniqueUsername('free', exists), 'free');
		assert.equal(await generateUniqueUsername('johndoe', exists), 'johndoe2');
	});
});
