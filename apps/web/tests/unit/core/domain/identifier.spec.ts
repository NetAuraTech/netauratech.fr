import { test } from '@japa/runner';
import { Identifier } from '#core/domain/identifier';
import { FileFolderIdentifier, FileIdentifier } from '#file/domain/identifiers';
import { UserIdentifier } from '#identity/domain/identifiers';

/**
 * Unit tests for the kernel {@link Identifier} base — the shared base of every
 * domain identifier, generic over the wrapped value type.
 */
test.group('Identifier', () => {
	test('wraps a numeric primary key and exposes it through value', ({ assert }) => {
		const id = new Identifier<number>(42);

		assert.equal(id.value, 42);
	});

	test('wraps a string value when the value type is a string', ({ assert }) => {
		const id = new Identifier<string>('abc-123');

		assert.equal(id.value, 'abc-123');
	});

	test('toString() returns the string form of the wrapped value', ({ assert }) => {
		assert.equal(new Identifier<number>(42).toString(), '42');
		assert.equal(new Identifier<string>('abc').toString(), 'abc');
	});

	test('equals() compares the wrapped value', ({ assert }) => {
		const a = new Identifier<number>(1);
		const b = new Identifier<number>(1);
		const c = new Identifier<number>(2);

		assert.isTrue(a.equals(b));
		assert.isFalse(a.equals(c));
	});

	test('domain identifiers inherit the base behaviour', ({ assert }) => {
		const id = UserIdentifier.of(7);

		assert.isTrue(id instanceof Identifier);
		assert.equal(id.value, 7);
		assert.equal(id.toString(), '7');
		assert.isTrue(id.equals(UserIdentifier.of(7)));
		assert.isFalse(id.equals(UserIdentifier.of(8)));
	});

	test('identifiers of different domains are not equal, even for the same value', ({ assert }) => {
		const file = FileIdentifier.of(1);
		const folder = FileFolderIdentifier.of(1);

		assert.isFalse(file.equals(folder));
	});
});
