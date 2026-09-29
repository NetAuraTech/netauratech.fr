import { test } from '@japa/runner';
import { nestTranslation, type TranslationNodes } from '#transport/core/helpers/translation_tree';

test.group('translation_tree', () => {
	test('nestTranslation() sets a top-level leaf for a single-segment key', ({ assert }) => {
		const tree: TranslationNodes = {};
		nestTranslation(tree, 'title', 'Hello');
		assert.deepEqual(tree, { title: 'Hello' });
	});

	test('nestTranslation() creates intermediate levels from a dotted key', ({ assert }) => {
		const tree: TranslationNodes = {};
		nestTranslation(tree, 'users.create', { value: 'permissions.users.create.value' });
		assert.deepEqual(tree, { users: { create: { value: 'permissions.users.create.value' } } });
	});

	test('nestTranslation() nests arbitrarily deep', ({ assert }) => {
		const tree: TranslationNodes = {};
		nestTranslation(tree, 'a.b.c', 'leaf');
		assert.deepEqual(tree, { a: { b: { c: 'leaf' } } });
	});

	test('nestTranslation() merges into existing branches without touching siblings', ({ assert }) => {
		const tree: TranslationNodes = { users: { list: 'Users' } };
		nestTranslation(tree, 'users.create', { value: 'Create' });
		assert.deepEqual(tree, { users: { list: 'Users', create: { value: 'Create' } } });
	});

	test('nestTranslation() overwrites an existing leaf', ({ assert }) => {
		const tree: TranslationNodes = { title: 'Old' };
		nestTranslation(tree, 'title', 'New');
		assert.deepEqual(tree, { title: 'New' });
	});
});
