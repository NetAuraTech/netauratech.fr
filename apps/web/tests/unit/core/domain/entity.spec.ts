import { test } from '@japa/runner';
import { Entity } from '#core/domain/entity';
import { Identifier } from '#core/domain/identifier';

/** A concrete test identifier for the {@link TestEntity} fixture. */
class TestIdentifier extends Identifier<number> {
	private constructor(value: number) {
		super(value);
	}

	static of(value: number): TestIdentifier {
		return new TestIdentifier(value);
	}
}

/** A minimal concrete entity for exercising the {@link Entity} base. */
class TestEntity extends Entity<{ id: TestIdentifier | null; name: string }> {
	constructor(id: TestIdentifier | null, name: string) {
		super({ id, name });
	}
}

/**
 * Unit tests for the kernel {@link Entity} base — the shared base of every
 * domain entity.
 */
test.group('Entity', () => {
	test('getIdentifier() returns the identity from props', ({ assert }) => {
		const id = TestIdentifier.of(1);
		const entity = new TestEntity(id, 'a');

		assert.isTrue(entity.getIdentifier() instanceof TestIdentifier);
		assert.equal(entity.getIdentifier()!.value, 1);
	});

	test('getIdentifier() returns null for an entity that is not persisted yet', ({ assert }) => {
		assert.isNull(new TestEntity(null, 'a').getIdentifier());
	});

	test('equals() is true for the same reference', ({ assert }) => {
		const entity = new TestEntity(TestIdentifier.of(1), 'a');

		assert.isTrue(entity.equals(entity));
	});

	test('equals() is true for two entities with the same identity', ({ assert }) => {
		const a = new TestEntity(TestIdentifier.of(1), 'a');
		const b = new TestEntity(TestIdentifier.of(1), 'b');

		assert.isTrue(a.equals(b));
	});

	test('equals() is false for two entities with different identities', ({ assert }) => {
		const a = new TestEntity(TestIdentifier.of(1), 'a');
		const b = new TestEntity(TestIdentifier.of(2), 'a');

		assert.isFalse(a.equals(b));
	});

	test('equals() is false when either entity has a null identity', ({ assert }) => {
		const unpersisted = new TestEntity(null, 'a');
		const persisted = new TestEntity(TestIdentifier.of(1), 'a');

		assert.isFalse(unpersisted.equals(persisted));
		assert.isFalse(persisted.equals(unpersisted));
		assert.isFalse(unpersisted.equals(new TestEntity(null, 'b')));
	});
});
