import type { ApiResponse } from '@japa/api-client';

/**
 * VineJS 422 bodies are a flat array of `{ field, message, rule }` entries.
 * Returns the entry for a given field (or undefined when the field is absent).
 */
export const fieldError = (res: ApiResponse, field: string) =>
	res.body().errors.find((entry: { field: string }) => entry.field === field);
