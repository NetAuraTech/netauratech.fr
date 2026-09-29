import { test } from '@japa/runner';
import {
	listFileValidator,
	showFileValidator,
	moveFileValidator,
	upsertAltValidator,
	deleteAltValidator,
	createFolderValidator,
	updateFolderValidator,
} from '#transport/file/validators/file';

/**
 * Unit tests for file and folder validators.
 * No database required — pure schema validation.
 */
test.group('File validators', () => {
	// ─── listFileValidator ────────────────────────────────────────────────────

	test('listFileValidator accepts empty payload', async ({ assert }) => {
		const result = await listFileValidator.validate({});
		assert.isOk(result);
	});

	test('listFileValidator accepts folder_id as null', async ({ assert }) => {
		const result = await listFileValidator.validate({ folder_id: null });
		assert.isUndefined(result.folder_id);
	});

	test('listFileValidator accepts folder_id as a positive number', async ({ assert }) => {
		const result = await listFileValidator.validate({ folder_id: 3 });
		assert.equal(result.folder_id, 3);
	});

	test('listFileValidator rejects negative folder_id', async ({ assert }) => {
		await assert.rejects(() => listFileValidator.validate({ folder_id: -1 }));
	});

	// ─── showFileValidator ────────────────────────────────────────────────────

	test('showFileValidator requires positive id', async ({ assert }) => {
		await assert.rejects(() => showFileValidator.validate({ id: 0 }));
		await assert.rejects(() => showFileValidator.validate({}));
	});

	test('showFileValidator accepts valid id', async ({ assert }) => {
		const result = await showFileValidator.validate({ id: 5 });
		assert.equal(result.id, 5);
	});

	// ─── moveFileValidator ────────────────────────────────────────────────────

	test('moveFileValidator accepts folder_id as null (move to root)', async ({ assert }) => {
		const result = await moveFileValidator.validate({ folder_id: null });
		assert.isNull(result.folder_id);
	});

	test('moveFileValidator accepts empty payload', async ({ assert }) => {
		const result = await moveFileValidator.validate({});
		assert.isOk(result);
	});

	// ─── upsertAltValidator ───────────────────────────────────────────────────

	test('upsertAltValidator requires locale, key, and value', async ({ assert }) => {
		await assert.rejects(() => upsertAltValidator.validate({ locale: 'en', key: 'hero' }));
		await assert.rejects(() => upsertAltValidator.validate({ locale: 'en', value: 'Alt' }));
		await assert.rejects(() => upsertAltValidator.validate({ key: 'hero', value: 'Alt' }));
	});

	test('upsertAltValidator trims all fields', async ({ assert }) => {
		const result = await upsertAltValidator.validate({
			locale: ' en ',
			key: ' hero ',
			value: ' Alt text ',
		});
		assert.equal(result.locale, 'en');
		assert.equal(result.key, 'hero');
		assert.equal(result.value, 'Alt text');
	});

	test('upsertAltValidator rejects key longer than 100 chars', async ({ assert }) => {
		await assert.rejects(() => upsertAltValidator.validate({ locale: 'en', key: 'a'.repeat(101), value: 'Alt' }));
	});

	test('upsertAltValidator rejects value longer than 500 chars', async ({ assert }) => {
		await assert.rejects(() => upsertAltValidator.validate({ locale: 'en', key: 'hero', value: 'a'.repeat(501) }));
	});

	// ─── deleteAltValidator ───────────────────────────────────────────────────

	test('deleteAltValidator requires locale and key', async ({ assert }) => {
		await assert.rejects(() => deleteAltValidator.validate({ locale: 'en' }));
		await assert.rejects(() => deleteAltValidator.validate({ key: 'hero' }));
	});

	test('deleteAltValidator accepts valid payload', async ({ assert }) => {
		const result = await deleteAltValidator.validate({ locale: 'en', key: 'hero' });
		assert.equal(result.locale, 'en');
		assert.equal(result.key, 'hero');
	});

	// ─── createFolderValidator ────────────────────────────────────────────────

	test('createFolderValidator requires name', async ({ assert }) => {
		await assert.rejects(() => createFolderValidator.validate({}));
	});

	test('createFolderValidator accepts name without parentId', async ({ assert }) => {
		const result = await createFolderValidator.validate({ name: 'Images' });
		assert.equal(result.name, 'Images');
		assert.isUndefined(result.parentId);
	});

	test('createFolderValidator accepts parentId as null', async ({ assert }) => {
		const result = await createFolderValidator.validate({ name: 'Images', parentId: null });
		assert.isNull(result.parentId);
	});

	test('createFolderValidator accepts positive parentId', async ({ assert }) => {
		const result = await createFolderValidator.validate({ name: 'Sub', parentId: 3 });
		assert.equal(result.parentId, 3);
	});

	test('createFolderValidator trims name', async ({ assert }) => {
		const result = await createFolderValidator.validate({ name: '  Images  ' });
		assert.equal(result.name, 'Images');
	});

	// ─── updateFolderValidator ────────────────────────────────────────────────

	test('updateFolderValidator requires id and name', async ({ assert }) => {
		await assert.rejects(() => updateFolderValidator.validate({ name: 'Images' }));
		await assert.rejects(() => updateFolderValidator.validate({ id: 1 }));
	});

	test('updateFolderValidator accepts valid payload', async ({ assert }) => {
		const result = await updateFolderValidator.validate({ id: 1, name: 'Renamed' });
		assert.equal(result.id, 1);
		assert.equal(result.name, 'Renamed');
	});
});
