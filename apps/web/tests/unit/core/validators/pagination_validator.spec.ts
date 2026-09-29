import { test } from '@japa/runner';
import { paginationValidator } from '#transport/core/validators/pagination';

test.group('Pagination Validator', () => {
	test('validates valid pagination payload', async ({ assert }) => {
		const payload = { page: 1, perPage: 10 };
		const result = await paginationValidator.validate(payload);
		assert.deepEqual(result, payload);
	});

	test('validates optional pagination payload', async ({ assert }) => {
		const result = await paginationValidator.validate({});
		assert.isUndefined(result.page);
		assert.isUndefined(result.perPage);
	});

	test('rejects negative or zero page and perPage', async ({ assert }) => {
		await assert.rejects(() => paginationValidator.validate({ page: 0 }));
		await assert.rejects(() => paginationValidator.validate({ perPage: 0 }));
		await assert.rejects(() => paginationValidator.validate({ page: -1 }));
	});

	test('rejects perPage greater than 100', async ({ assert }) => {
		await assert.rejects(() => paginationValidator.validate({ perPage: 101 }));
	});
});
