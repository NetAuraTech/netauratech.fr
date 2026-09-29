/**
 * Removes entries with empty string values from a record.
 *
 * Applied server-side to incoming request payloads (form data and REST
 * input) before validation, so that optional fields left blank by the
 * client are dropped rather than interpreted as intentional empty-string
 * updates.
 *
 * @param data - The record to filter.
 * @returns A new record containing only entries whose value is not `''`.
 *
 * @example
 * stripEmptyStrings({ name: 'Alice', bio: '', age: 30 })
 * // → { name: 'Alice', age: 30 }
 */
export function stripEmptyStrings(data: Record<string, unknown>) {
	return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== ''));
}
