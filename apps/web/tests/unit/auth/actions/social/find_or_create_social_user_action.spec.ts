import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { FindOrCreateSocialUserAction } from '#auth/actions/social/find_or_create_social_user_action';
import UnverifiedAccountException from '#auth/exceptions/unverified_account_exception';
import Role from '#identity/models/role';
import User from '#identity/models/user';

test.group('FindOrCreateSocialUserAction', () => {
	test('execute() returns existing user by provider id', async ({ assert }) => {
		const action = await app.container.make(FindOrCreateSocialUserAction);

		const user = await User.create({
			email: 'social1@test.com',
			username: 'social1',
			githubId: 'gh_123',
		});

		const allyUser = { id: 'gh_123' } as any;
		const foundUser = await action.execute({ allyUser, provider: 'github' });

		assert.equal(foundUser.id, user.id);
	});

	test('execute() links provider if email matches and is verified', async ({ assert }) => {
		const action = await app.container.make(FindOrCreateSocialUserAction);

		const user = await User.create({
			email: 'social2@test.com',
			username: 'social2',
			emailVerifiedAt: DateTime.now(),
		});
		assert.isUndefined(user.githubId);

		const allyUser = { id: 'gh_456', email: 'social2@test.com' } as any;
		const linkedUser = await action.execute({ allyUser, provider: 'github' });

		assert.equal(linkedUser.id, user.id);
		assert.equal(linkedUser.githubId, 'gh_456');
	});

	test('execute() throws UnverifiedAccountException if email matches but unverified', async ({ assert }) => {
		const action = await app.container.make(FindOrCreateSocialUserAction);

		await User.create({ email: 'social3@test.com', username: 'social3' });

		const allyUser = { id: 'gh_789', email: 'social3@test.com' } as any;

		await assert.rejects(async () => {
			await action.execute({ allyUser, provider: 'github' });
		}, UnverifiedAccountException);
	});

	test('execute() creates new user if no match found', async ({ assert }) => {
		const action = await app.container.make(FindOrCreateSocialUserAction);
		await Role.firstOrCreate({ slug: 'user' }, { slug: 'user', name: 'User Role' });

		const allyUser = {
			id: 'gh_new_social',
			email: 'new_social@test.com',
			nickName: 'New Social',
		} as any;

		const newUser = await action.execute({ allyUser, provider: 'github' });

		assert.isNotNull(newUser.id);
		assert.equal(newUser.email, 'new_social@test.com');
		assert.equal(newUser.githubId, 'gh_new_social');
		assert.isNotNull(newUser.emailVerifiedAt);
	});
});
