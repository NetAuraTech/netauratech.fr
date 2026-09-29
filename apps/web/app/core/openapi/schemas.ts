import type { JsonSchema } from '#transport/core/openapi/api_docs_registry';

/** Nullable ISO-8601 timestamp as produced by the serializers. */
export const dateTime: JsonSchema = { type: 'string', format: 'date-time', nullable: true };

/** The standard JSON error envelope, as shaped by the exception handler. */
export const errorSchema: JsonSchema = {
	type: 'object',
	properties: {
		error: {
			type: 'object',
			properties: {
				code: { type: 'string' },
				message: { type: 'string' },
				details: { type: 'object' },
			},
		},
	},
};

/** The 422 validation error body, as shaped by Vine's default handler. */
export const validationErrorSchema: JsonSchema = {
	type: 'object',
	properties: {
		errors: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					message: { type: 'string' },
					field: { type: 'string' },
				},
			},
		},
	},
};

/** A bare `{ message }` body, as sent by `response.ok({ message })`. */
export const messageSchema: JsonSchema = {
	type: 'object',
	properties: {
		message: { type: 'string' },
	},
};

/** The REST success envelope: the payload serialized under `data`. */
export const dataEnvelope = (schema: JsonSchema): JsonSchema => ({
	type: 'object',
	properties: { data: schema },
});

/** The REST pagination envelope: items under `data`, page metadata under `metadata`. */
export const paginatedEnvelope = (itemSchema: JsonSchema): JsonSchema => ({
	type: 'object',
	properties: {
		data: { type: 'array', items: itemSchema },
		metadata: {
			type: 'object',
			properties: {
				total: { type: 'number' },
				perPage: { type: 'number' },
				currentPage: { type: 'number' },
				lastPage: { type: 'number' },
			},
		},
	},
});
