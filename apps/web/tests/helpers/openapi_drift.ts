import { BaseSerializer } from '@adonisjs/core/transformers';
import { Ajv, type ErrorObject } from 'ajv';

/**
 * Shared helpers for the OpenAPI response-schema drift tests (issue #440).
 *
 * The drift tests serialize fixtures through every REST transformer and pin
 * the result against the hand-written OpenAPI response schema so that:
 *  - a payload that drops or renames a documented field is rejected, and
 *  - an undocumented field appearing in the payload is rejected.
 *
 * The hand-written schemas use the OpenAPI `nullable: true` extension, which
 * is not valid JSON Schema; {@link toAjvSchema} rewrites it into a union type
 * so that Ajv can compile the schema.
 */

type AnySchema = Record<string, any>;

// Formats (`date-time`, `email`) are intentionally not enforced — the OpenAPI
// docs use them as hints, and `strict: false` would only make Ajv log every
// unknown format to stderr, drowning the test output.
const ajv = new Ajv({ strict: false, allErrors: true, logger: false });

/**
 * Minimal serializer that resolves transformer output exactly like the API
 * serializer does (lazy `Item`/`Collection` relations become plain objects)
 * without applying the `data` wrapping — the tests rebuild the envelope to
 * mirror the documented response schema.
 */
class DriftSerializer extends BaseSerializer<{ Wrap?: undefined }> {
	wrap: undefined = undefined;

	definePaginationMetaData(metaData: unknown) {
		return metaData as Record<string, any>;
	}
}

const serializer = new DriftSerializer();

/**
 * Resolve a transformer's `toObject()` result through the serializer pipeline
 * and normalize it the way the JSON response would be: lazy relations become
 * plain objects, `undefined` values are dropped, and `Date` / luxon `DateTime`
 * values become ISO strings.
 */
export async function serializePayload(resourceData: Record<string, any>): Promise<any> {
	const resolved = await serializer.serializeWithoutWrapping(resourceData);
	return JSON.parse(JSON.stringify(resolved));
}

/**
 * Rewrite an OpenAPI-flavoured schema into a pure JSON Schema for Ajv:
 * `nullable: true` becomes a `[type, 'null']` union. Returns a deep copy; the
 * source schema is never mutated.
 */
export function toAjvSchema(schema: AnySchema): AnySchema {
	const clone = JSON.parse(JSON.stringify(schema)) as AnySchema;

	const walk = (node: any): void => {
		if (node === null || typeof node !== 'object') {
			return;
		}
		if (Array.isArray(node)) {
			node.forEach(walk);
			return;
		}
		if (node.nullable === true && typeof node.type === 'string') {
			node.type = [node.type, 'null'];
		}
		delete node.nullable;
		for (const value of Object.values(node)) {
			walk(value);
		}
	};

	walk(clone);
	return clone;
}

/**
 * Normalize a transformer output the way the JSON serializer would: drop
 * `undefined` values and turn `Date` / luxon `DateTime` into ISO strings.
 */
export function normalize(value: unknown): any {
	return JSON.parse(JSON.stringify(value));
}

/**
 * Pin a transformer payload against a documented response schema.
 *
 * Throws when the two drift: on a type mismatch (reported by Ajv) or on a
 * key-set mismatch (a documented field missing from the payload, or an emitted
 * field the schema does not declare).
 */
export function pinDrift(itemSchema: AnySchema, payload: Record<string, any>, label: string): void {
	const schema = toAjvSchema(itemSchema);

	const validate = ajv.compile(schema);
	if (!validate(payload)) {
		const details = (validate.errors ?? [])
			.map((e: ErrorObject) => `${e.instancePath || '(root)'} ${e.message ?? ''}`.trim())
			.join('; ');
		throw new Error(`${label}: payload does not conform to the documented schema — ${details}`);
	}

	const declared = new Set(Object.keys((schema.properties ?? {}) as Record<string, any>));
	const emitted = new Set(Object.keys(payload));
	const missing = [...declared].filter((key) => !emitted.has(key));
	const extra = [...emitted].filter((key) => !declared.has(key));

	if (missing.length > 0 || extra.length > 0) {
		throw new Error(
			`${label}: schema/transformer key-set drift — ` +
				`documented but missing from payload: [${missing.join(', ')}]; ` +
				`emitted but not documented: [${extra.join(', ')}]`,
		);
	}
}

/**
 * Validate a full REST response envelope against its documented schema (the
 * `data`/`metadata` wrapping or a legacy named wrap). This is a structural
 * check on the envelope itself; the payload field drift is pinned by
 * {@link pinDrift}.
 */
export function pinEnvelope(envelopeSchema: AnySchema, envelope: Record<string, any>, label: string): void {
	const schema = toAjvSchema(envelopeSchema);
	const validate = ajv.compile(schema);

	if (!validate(envelope)) {
		const details = (validate.errors ?? [])
			.map((e: ErrorObject) => `${e.instancePath || '(root)'} ${e.message ?? ''}`.trim())
			.join('; ');
		throw new Error(`${label}: envelope does not conform to the documented schema — ${details}`);
	}
}

/**
 * A realistic Lucid `SimplePaginator` metadata block — the nine keys the API
 * serializer's `definePaginationMetaData` contract expects.
 */
export function lucidMeta(overrides: Record<string, any> = {}): Record<string, any> {
	return {
		total: 2,
		perPage: 20,
		currentPage: 1,
		lastPage: 1,
		firstPage: 1,
		firstPageUrl: '/?page=1',
		lastPageUrl: '/?page=1',
		nextPageUrl: null,
		previousPageUrl: null,
		...overrides,
	};
}
