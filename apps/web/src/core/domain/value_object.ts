/**
 * Base class for all domain value objects.
 *
 * A value object is a pure domain object without an identity: two value
 * objects are interchangeable when their properties are equal. Subclasses
 * hand their properties to the base constructor and inherit `props` and the
 * value-based `equals`.
 */
export abstract class ValueObject<T extends Record<string, any>> {
	props: T;

	constructor(props: T) {
		this.props = {
			...props,
		};
	}

	equals(vo?: ValueObject<T>): boolean {
		if (vo === null || vo === undefined) {
			return false;
		}

		if (vo.props === undefined) {
			return false;
		}

		return ValueObject.deepEqual(this.props, vo.props);
	}

	/**
	 * Deep, key-order-insensitive structural comparison of two values.
	 *
	 * Primitives compare with `===`; arrays compare element by element;
	 * plain objects compare their own enumerable keys (order irrelevant);
	 * `Date` values compare their timestamps.
	 *
	 * @param a - The first value.
	 * @param b - The second value.
	 * @returns `true` when both values are structurally equal.
	 */
	protected static deepEqual(a: unknown, b: unknown): boolean {
		if (a === b) {
			return true;
		}

		if (a instanceof Date && b instanceof Date) {
			return a.getTime() === b.getTime();
		}

		if (a instanceof Date || b instanceof Date) {
			return false;
		}

		if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
			return false;
		}

		if (Array.isArray(a) !== Array.isArray(b)) {
			return false;
		}

		if (Array.isArray(a) && Array.isArray(b)) {
			return a.length === b.length && a.every((item, index) => ValueObject.deepEqual(item, b[index]));
		}

		const aRecord = a as Record<string, unknown>;
		const bRecord = b as Record<string, unknown>;
		const aKeys = Object.keys(aRecord);
		const bKeys = Object.keys(bRecord);

		if (aKeys.length !== bKeys.length) {
			return false;
		}

		return aKeys.every((key) => Object.hasOwn(bRecord, key) && ValueObject.deepEqual(aRecord[key], bRecord[key]));
	}
}
