import { test } from '@japa/runner';
import File from '#file/models/file';
import FileAlt from '#file/models/file_alt';

/**
 * Unit tests for the `File` model.
 * Focus: `resolveAlt()` logic — no DB required, we construct instances directly.
 *
 * The priority chain is: keyed FileAlt for the requested locale → keyed FileAlt
 * for the default locale → keyed FileAlt in any locale → first alt → override.
 */
test.group('File model — resolveAlt()', () => {
	function makeFile(alts: Partial<FileAlt>[] = []): File {
		const file = new File();
		file.id = 1;

		const altInstances = alts.map((a) => {
			const alt = new FileAlt();
			Object.assign(alt, a);
			return alt;
		});

		file.$setRelated('alts', altInstances);
		return file;
	}

	test('returns the keyed alt for the requested locale when it matches', ({ assert }) => {
		const file = makeFile([
			{ locale: 'en', key: 'hero', value: 'English hero alt' },
			{ locale: 'fr', key: 'hero', value: 'French hero alt' },
		]);
		assert.equal(file.resolveAlt('en', 'hero'), 'English hero alt');
		assert.equal(file.resolveAlt('fr', 'hero'), 'French hero alt');
	});

	test('falls back to the default-locale keyed alt when the requested locale misses', ({ assert }) => {
		const file = makeFile([{ locale: 'en', key: 'hero', value: 'English hero alt' }]);
		assert.equal(file.resolveAlt('fr', 'hero'), 'English hero alt');
	});

	test('falls back to the keyed alt in any locale when locale and default both miss', ({ assert }) => {
		const file = makeFile([
			{ locale: 'en', key: 'hero', value: 'English hero alt' },
			{ locale: 'de', key: 'hero', value: 'German hero alt' },
		]);
		assert.equal(file.resolveAlt('fr', 'hero'), 'English hero alt');
	});

	test('does not confuse two different keys for the same locale', ({ assert }) => {
		const file = makeFile([
			{ locale: 'en', key: 'hero', value: 'Hero alt' },
			{ locale: 'en', key: 'thumbnail', value: 'Thumbnail alt' },
		]);
		assert.equal(file.resolveAlt('en', 'hero'), 'Hero alt');
		assert.equal(file.resolveAlt('en', 'thumbnail'), 'Thumbnail alt');
	});

	test('returns the first alt as fallback when no key is provided', ({ assert }) => {
		const file = makeFile([
			{ locale: 'en', key: 'hero', value: 'Hero alt' },
			{ locale: 'fr', key: 'thumbnail', value: 'Thumbnail alt' },
		]);
		assert.equal(file.resolveAlt('en', null), 'Hero alt');
	});

	test('returns the first alt as fallback when the key matches nowhere', ({ assert }) => {
		const file = makeFile([{ locale: 'en', key: 'hero', value: 'Hero alt' }]);
		assert.equal(file.resolveAlt('en', 'thumbnail'), 'Hero alt');
	});

	test('returns the override only when no alt entry is available', ({ assert }) => {
		const file = makeFile([]);
		assert.equal(file.resolveAlt('en', 'hero', 'Override text'), 'Override text');
	});

	test('prefers the keyed alt over an override', ({ assert }) => {
		const file = makeFile([{ locale: 'en', key: 'hero', value: 'Named alt' }]);
		assert.equal(file.resolveAlt('en', 'hero', 'Override text'), 'Named alt');
	});

	test('empty string override is falsy and falls through to first alt', ({ assert }) => {
		const file = makeFile([{ locale: 'en', key: 'hero', value: 'Named alt' }]);
		assert.equal(file.resolveAlt('en', 'hero', ''), 'Named alt');
	});

	test('returns empty string when no alts and no override', ({ assert }) => {
		const file = makeFile([]);
		assert.equal(file.resolveAlt('en', 'hero'), '');
		assert.equal(file.resolveAlt('en', null), '');
	});

	test('null override falls through to first alt', ({ assert }) => {
		const file = makeFile([{ locale: 'en', key: 'hero', value: 'Named alt' }]);
		assert.equal(file.resolveAlt('en', 'hero', null), 'Named alt');
	});
});
