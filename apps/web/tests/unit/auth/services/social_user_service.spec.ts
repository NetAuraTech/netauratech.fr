import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import UnverifiedAccountException from '#auth/exceptions/unverified_account_exception';
import { SocialUserService } from '#auth/services/social_user_service';
import Role from '#identity/models/role';
import User from '#identity/models/user';

test.group('SocialUserService', () => {
	test('findOrCreate() returns existing user by provider id', async ({ assert }) => {
		const service = await app.container.make(SocialUserService);

		const user = await User.create({
			email: 'svcsocial1@test.com',
			username: 'svcsocial1',
			githubId: 'svc_gh_123',
		});

		const allyUser = { id: 'svc_gh_123' } as any;
		const foundUser = await service.findOrCreate(allyUser, 'github');

		assert.equal(foundUser.id, user.id);
	});

	test('findOrCreate() links provider if email matches and is verified', async ({ assert }) => {
		const service = await app.container.make(SocialUserService);

		const user = await User.create({
			email: 'svcsocial2@test.com',
			username: 'svcsocial2',
			emailVerifiedAt: DateTime.now(),
		});
		assert.isUndefined(user.githubId);

		const allyUser = { id: 'svc_gh_456', email: 'svcsocial2@test.com' } as any;
		const linkedUser = await service.findOrCreate(allyUser, 'github');

		assert.equal(linkedUser.id, user.id);
		assert.equal(linkedUser.githubId, 'svc_gh_456');
	});

	test('findOrCreate() throws UnverifiedAccountException if email matches but unverified', async ({ assert }) => {
		const service = await app.container.make(SocialUserService);

		await User.create({ email: 'svcsocial3@test.com', username: 'svcsocial3' });

		const allyUser = { id: 'svc_gh_789', email: 'svcsocial3@test.com' } as any;

		await assert.rejects(async () => {
			await service.findOrCreate(allyUser, 'github');
		}, UnverifiedAccountException);
	});

	test('findOrCreate() creates new user if no match found', async ({ assert }) => {
		const service = await app.container.make(SocialUserService);
		await Role.firstOrCreate({ slug: 'user' }, { slug: 'user', name: 'User Role' });

		const allyUser = {
			id: 'svc_gh_new_social',
			email: 'svc_new_social@test.com',
			nickName: 'Svc New Social',
		} as any;

		const newUser = await service.findOrCreate(allyUser, 'github');

		assert.isNotNull(newUser.id);
		assert.equal(newUser.email, 'svc_new_social@test.com');
		assert.equal(newUser.githubId, 'svc_gh_new_social');
		assert.isNotNull(newUser.emailVerifiedAt);
	});
});
