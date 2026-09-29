import { test } from '@japa/runner';
import { ValueObject } from '#core/domain/value_object';

/** A minimal concrete value object for exercising the {@link ValueObject} base. */
class TestValueObject extends ValueObject<{ a: number; b: string }> {
	constructor(a: number, b: string) {
		super({ a, b });
	}
}

/** A value object whose props can be inserted in a different key order. */
class ReorderedValueObject extends ValueObject<{ a: number; b: string }> {
	constructor(a: number, b: string, reversed: boolean) {
		super(reversed ? { b, a } : { a, b });
	}
}

/** A value object with a nested object prop. */
class NestedValueObject extends ValueObject<{ outer: { x: number; y: number } }> {
	constructor(outer: { x: number; y: number }) {
		super({ outer });
	}
}

/** A value object whose prop can hold a `Date` or a plain object. */
class DateValueObject extends ValueObject<{ at: unknown }> {
	constructor(at: unknown) {
		super({ at });
	}
}

/**
 * Unit tests for the kernel {@link ValueObject} base — the shared base of
 * every domain value object.
 */
test.group('ValueObject', () => {
	test('copies the props into the instance', ({ assert }) => {
		const vo = new TestValueObject(1, 'x');
		const source = { a: 1, b: 'x' };
		source.a = 2;

		assert.deepEqual(vo.props, { a: 1, b: 'x' });
	});

	test('equals() is true for two value objects with the same props', ({ assert }) => {
		const a = new TestValueObject(1, 'x');
		const b = new TestValueObject(1, 'x');

		assert.isTrue(a.equals(b));
	});

	test('equals() is false for two value objects with different props', ({ assert }) => {
		const a = new TestValueObject(1, 'x');
		const b = new TestValueObject(2, 'x');

		assert.isFalse(a.equals(b));
	});

	test('equals() is false for null or undefined', ({ assert }) => {
		const a = new TestValueObject(1, 'x');

		assert.isFalse(a.equals(null as any));
		assert.isFalse(a.equals(undefined));
	});

	test('equals() is true when the props are structurally equal but in a different key order', ({ assert }) => {
		const a = new ReorderedValueObject(1, 'x', false);
		const b = new ReorderedValueObject(1, 'x', true);

		assert.isTrue(a.equals(b));
	});

	test('equals() is true for structurally equal nested objects in a different key order', ({ assert }) => {
		const a = new NestedValueObject({ x: 1, y: 2 });
		const b = new NestedValueObject({ y: 2, x: 1 });

		assert.isTrue(a.equals(b));
	});

	test('equals() is false when a nested object differs in depth or keys', ({ assert }) => {
		const a = new NestedValueObject({ x: 1, y: 2 });
		const b = new NestedValueObject({ x: 1, y: 2, z: 3 } as { x: number; y: number });

		assert.isFalse(a.equals(b));
	});

	test('equals() is false when a Date is compared against a plain object', ({ assert }) => {
		const a = new DateValueObject(new Date('2026-01-01'));
		const b = new DateValueObject({});

		assert.isFalse(a.equals(b));
	});
});
