import { test } from '@japa/runner';
import { updateValidator } from '#transport/account/validators/preference';

test.group('Preference Validator', () => {
	test('validates valid preference payload', async ({ assert }) => {
		const payload = { theme: 'dark', locale: 'en' };
		const result = await updateValidator.validate(payload);
		assert.deepEqual(result, payload);
	});

	test('validates partial preference payload', async ({ assert }) => {
		const result = await updateValidator.validate({ theme: 'light' });
		assert.equal(result.theme, 'light');
		assert.isUndefined(result.locale);
	});

	test('rejects invalid theme', async ({ assert }) => {
		await assert.rejects(() => updateValidator.validate({ theme: 'system' }));
	});

	test('rejects invalid locale', async ({ assert }) => {
		await assert.rejects(() => updateValidator.validate({ locale: 'es' }));
	});
});
