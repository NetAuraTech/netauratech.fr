/**
 * Contract for translating i18n keys in the current locale and building
 * nested translation payloads.
 *
 * The business layer (dashboard registries, collectors) and the transport
 * layer (payload builders, middleware) both depend on this contract rather
 * than on a concrete service, keeping the kernel decoupled from the
 * transport's request-scoped i18n service.
 */
export interface I18nTranslator {
	/** Returns the current locale string. */
	getLocale(): string;

	/** Translates a single dot-notation key, resolving ICU replacements. */
	translate(key: string, replacements?: Record<string, any>): string;

	/** Creates a translation entry marker for use inside `buildPayload`. */
	entry(key: string, replacements?: Record<string, any>): I18nEntry;

	/** Builds a nested translation payload from a flat key mapping. */
	buildPayload<T extends Record<string, string | I18nEntry | object>>(mapping: T): BuildPayloadResult<T>;
}

/**
 * Marker type returned by {@link I18nTranslator.entry} /
 * {@link createI18nEntry}. Recognized by the payload builder which calls
 * `translate(key, replacements)` in a single pass.
 */
export type I18nEntry = { __i18n_key: string; __replacements: Record<string, any> };

/**
 * Creates a translation entry marker that can be composed into a module-level
 * mapping before the request-scoped translator is available (e.g. inside a
 * payload builder's key-mapping constant).
 *
 * @param key          - Dot-notation translation key
 * @param replacements - ICU-formatted replacement map, defaults to an empty object
 * @returns The entry marker resolved to its translated string by `buildPayload`
 */
export function createI18nEntry(key: string, replacements?: Record<string, any>): I18nEntry {
	return { __i18n_key: key, __replacements: replacements ?? {} };
}

/**
 * Type guard for {@link I18nEntry} markers nested inside a payload mapping.
 */
export function isI18nEntry(value: unknown): value is I18nEntry {
	return typeof value === 'object' && value !== null && '__i18n_key' in value && '__replacements' in value;
}

/**
 * Recursively replaces leaf `string` and {@link I18nEntry} values with their
 * translated `string`. Since `translate()` returns `string`, the shape is
 * preserved.
 */
export type BuildPayloadResult<T> = T extends string
	? string
	: T extends I18nEntry
		? string
		: T extends object
			? { [K in keyof T]: BuildPayloadResult<T[K]> }
			: T;
