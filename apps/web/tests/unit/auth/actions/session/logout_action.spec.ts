import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { LogoutAction } from '#auth/actions/session/logout_action';

test.group('LogoutAction', () => {
	test('execute() completes without errors', async () => {
		const action = await app.container.make(LogoutAction);
		await action.execute({ userId: 1, userEmail: 'logout@test.com' });
	});
});
