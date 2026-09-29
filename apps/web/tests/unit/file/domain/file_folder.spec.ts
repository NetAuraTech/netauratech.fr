import { test } from '@japa/runner';
import { FileFolder } from '#file/domain/file_folder';
import { FileFolderIdentifier } from '#file/domain/identifiers';

/**
 * Unit tests for the {@link FileFolder} domain object.
 */
test.group('FileFolder', () => {
	test('fromModel() hydrates the identity through a FileFolderIdentifier', ({ assert }) => {
		const folder = FileFolder.fromModel({ id: 2, name: 'Images', parentId: 1 });

		assert.isTrue(folder.id instanceof FileFolderIdentifier);
		assert.equal(folder.id.value, 2);
		assert.equal(folder.name, 'Images');
		assert.equal(folder.parentId, 1);
	});

	test('a folder with no parent is a root', ({ assert }) => {
		assert.isTrue(FileFolder.fromModel({ id: 1, name: 'Root', parentId: null }).isRoot());
	});

	test('a folder with a parent is not a root', ({ assert }) => {
		assert.isFalse(FileFolder.fromModel({ id: 2, name: 'Child', parentId: 1 }).isRoot());
	});

	test('equals() compares identities, not fields', ({ assert }) => {
		const a = FileFolder.fromModel({ id: 1, name: 'a', parentId: null });
		const b = FileFolder.fromModel({ id: 1, name: 'other', parentId: 2 });
		const c = FileFolder.fromModel({ id: 2, name: 'a', parentId: null });

		assert.isTrue(a.equals(b));
		assert.isFalse(a.equals(c));
	});
});
