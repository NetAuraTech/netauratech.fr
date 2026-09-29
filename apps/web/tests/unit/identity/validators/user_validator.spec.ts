import { test } from '@japa/runner';
import Role from '#identity/models/role';
import User from '#identity/models/user';
import {
	listValidator,
	showValidator,
	editValidator,
	createValidator,
	updateValidator,
	deleteValidator,
} from '#transport/identity/validators/user';

test.group('User Validators', () => {
	test('listValidator validates search and role', async ({ assert }) => {
		const validator = listValidator(['admin', 'editor']);

		// Valid empty
		let res = await validator.validate({});
		assert.isUndefined(res.search);
		assert.isUndefined(res.role);

		// Valid full
		res = await validator.validate({ search: 'john', role: 'admin' });
		assert.equal(res.search, 'john');
		assert.equal(res.role, 'admin');

		// Invalid role
		await assert.rejects(() => validator.validate({ role: 'unknown' }));
	});

	test('showValidator, editValidator, deleteValidator require existing user id', async ({ assert }) => {
		// Missing
		await assert.rejects(() => showValidator.validate({}));
		await assert.rejects(() => editValidator.validate({}));
		await assert.rejects(() => deleteValidator.validate({}));

		// Non-existent id
		await assert.rejects(() => showValidator.validate({ id: 999999 }));

		// Valid
		const user = await User.create({
			email: 'user_val_test@example.com',
			username: 'user_val_test',
			password: 'pwd',
		});
		const res = await showValidator.validate({ id: user.id });
		assert.equal(res.id, user.id);
	});

	test('createValidator validates unique constraints and valid role', async ({ assert }) => {
		// Note: 'admin' role might exist if run after another test, so let's just use it or find it.
		await Role.firstOrCreate({ slug: 'admin' }, { slug: 'admin', name: 'Admin' });
		await User.create({ email: 'user_taken@example.com', username: 'user_taken', password: 'pwd' });

		const validator = createValidator(['admin']);

		// Duplicate email
		await assert.rejects(() =>
			validator.validate({
				email: 'user_taken@example.com',
				username: 'user_val_new_1',
				role_id: 'admin',
			}),
		);

		// Duplicate username
		await assert.rejects(() =>
			validator.validate({
				email: 'user_val_new1@example.com',
				username: 'user_taken',
				role_id: 'admin',
			}),
		);

		// Invalid role
		await assert.rejects(() =>
			validator.validate({
				email: 'user_val_new@example.com',
				username: 'user_val_new_user',
				role_id: 'editor',
			}),
		);

		// Valid
		const res = await validator.validate({
			email: 'user_val_new@example.com',
			username: 'user_val_new_user',
			role_id: 'admin',
		});
		assert.equal(res.email, 'user_val_new@example.com');
		assert.equal(res.username, 'user_val_new_user');
	});

	test('updateValidator ignores self for unique constraints', async ({ assert }) => {
		const user1 = await User.create({
			email: 'user_val_1@example.com',
			username: 'user_val_1',
			password: 'pwd',
		});
		await User.create({
			email: 'user_val_2@example.com',
			username: 'user_val_2',
			password: 'pwd',
		});

		const validator = updateValidator(user1.id, ['admin']);

		// Using user2's email
		await assert.rejects(() =>
			validator.validate({
				email: 'user_val_2@example.com',
				username: 'new_user_2',
				role_id: 'admin',
			}),
		);

		// Using own email and username (valid)
		const res = await validator.validate({
			email: 'user_val_1@example.com',
			username: 'user_val_1',
			role_id: 'admin',
		});
		assert.equal(res.email, 'user_val_1@example.com');
		assert.equal(res.username, 'user_val_1');
	});
});
