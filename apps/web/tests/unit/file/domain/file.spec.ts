import { test } from '@japa/runner';
import { File } from '#file/domain/file';
import { FileAlt } from '#file/domain/file_alt';
import { FileIdentifier } from '#file/domain/identifiers';

const model = (
	overrides: Partial<{ id: number; alts: { locale: string; key: string; value: string }[] | null }> = {},
) => ({
	id: overrides.id ?? 1,
	filename: 'photo.png',
	originalName: 'photo.png',
	mimeType: 'image/png',
	extension: 'png',
	size: 1024,
	path: 'files/photo.png',
	disk: 'fs' as const,
	folderId: null,
	alts: overrides.alts ?? [],
});

/**
 * Unit tests for the {@link File} domain object — the single owner of the
 * alt-text resolution priority chain.
 */
test.group('File', () => {
	test('fromModel() hydrates the identity through a FileIdentifier', ({ assert }) => {
		const file = File.fromModel(model({ id: 4 }));

		assert.isTrue(file.id instanceof FileIdentifier);
		assert.equal(file.id.value, 4);
		assert.equal(file.filename, 'photo.png');
		assert.equal(file.folderId, null);
	});

	test('fromModel() hydrates the alt entries as domain value objects', ({ assert }) => {
		const file = File.fromModel(model({ alts: [{ locale: 'en', key: 'hero', value: 'A hero' }] }));

		const alts = file.getAlts();
		assert.lengthOf(alts, 1);
		assert.isTrue(alts[0] instanceof FileAlt);
		assert.equal(alts[0].value, 'A hero');
	});

	test('fromModel() tolerates a missing alts relation', ({ assert }) => {
		assert.lengthOf(File.fromModel(model({ alts: null })).getAlts(), 0);
	});

	test('resolveAlt() prefers the keyed alt for the requested locale', ({ assert }) => {
		const file = File.fromModel(
			model({
				alts: [
					{ locale: 'en', key: 'hero', value: 'English hero' },
					{ locale: 'fr', key: 'hero', value: 'French hero' },
				],
			}),
		);

		assert.equal(file.resolveAlt('fr', 'en', 'hero'), 'French hero');
	});

	test('resolveAlt() falls back to the keyed alt for the default locale', ({ assert }) => {
		const file = File.fromModel(model({ alts: [{ locale: 'en', key: 'hero', value: 'English hero' }] }));

		assert.equal(file.resolveAlt('fr', 'en', 'hero'), 'English hero');
	});

	test('resolveAlt() falls back to a keyed alt in any locale', ({ assert }) => {
		const file = File.fromModel(model({ alts: [{ locale: 'de', key: 'hero', value: 'German hero' }] }));

		assert.equal(file.resolveAlt('fr', 'en', 'hero'), 'German hero');
	});

	test('resolveAlt() falls back to the first alt when no key is requested', ({ assert }) => {
		const file = File.fromModel(
			model({
				alts: [
					{ locale: 'en', key: 'other', value: 'First alt' },
					{ locale: 'en', key: 'later', value: 'Second alt' },
				],
			}),
		);

		assert.equal(file.resolveAlt('en', 'en', null), 'First alt');
	});

	test('resolveAlt() uses the inline override when no alt matches', ({ assert }) => {
		const file = File.fromModel(model({}));

		assert.equal(file.resolveAlt('en', 'en', null, 'Override'), 'Override');
	});

	test('resolveAlt() returns an empty string when nothing matches', ({ assert }) => {
		const file = File.fromModel(model({}));

		assert.equal(file.resolveAlt('en', 'en', null), '');
	});

	test('equals() compares identities, not fields', ({ assert }) => {
		const a = File.fromModel(model({ id: 1 }));
		const b = File.fromModel(model({ id: 1, alts: [{ locale: 'en', key: 'k', value: 'v' }] }));
		const c = File.fromModel(model({ id: 2 }));

		assert.isTrue(a.equals(b));
		assert.isFalse(a.equals(c));
	});
});
