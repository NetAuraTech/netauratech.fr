import { test } from '@japa/runner';
import { FileAlt } from '#file/domain/file_alt';

/**
 * Unit tests for the {@link FileAlt} domain value object.
 */
test.group('FileAlt', () => {
	test('fromModel() hydrates the entry', ({ assert }) => {
		const alt = FileAlt.fromModel({ locale: 'fr', key: 'hero', value: 'Un héros' });

		assert.equal(alt.locale, 'fr');
		assert.equal(alt.key, 'hero');
		assert.equal(alt.value, 'Un héros');
	});

	test('matches() requires both locale and key to match', ({ assert }) => {
		const alt = FileAlt.fromModel({ locale: 'fr', key: 'hero', value: 'v' });

		assert.isTrue(alt.matches('fr', 'hero'));
		assert.isFalse(alt.matches('en', 'hero'));
		assert.isFalse(alt.matches('fr', 'other'));
	});

	test('matchesKey() ignores the locale', ({ assert }) => {
		const alt = FileAlt.fromModel({ locale: 'fr', key: 'hero', value: 'v' });

		assert.isTrue(alt.matchesKey('hero'));
		assert.isFalse(alt.matchesKey('other'));
	});

	test('equals() compares values, as a value object without identity', ({ assert }) => {
		const a = FileAlt.fromModel({ locale: 'fr', key: 'hero', value: 'v' });
		const b = FileAlt.fromModel({ locale: 'fr', key: 'hero', value: 'v' });
		const c = FileAlt.fromModel({ locale: 'fr', key: 'hero', value: 'other' });

		assert.isTrue(a.equals(b));
		assert.isFalse(a.equals(c));
	});
});
