import { createI18nEntry } from '#core/contracts/i18n_translator';
import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for translations shared with every Inertia page via
 * the middleware (pagination + generic validation messages). Placeholders are
 * carried literally and resolved client-side by `t(path, data)`.
 */
export const COMMON_MAPPING = {
	pagination: {
		showing: createI18nEntry('pagination.showing', {
			start: '{start}',
			end: '{end}',
			total: '{total}',
		}),
		previous: 'pagination.previous',
		next: 'pagination.next',
	},
	validation: {
		required: createI18nEntry('validation.front.required', { field: '{field}' }),
		email: 'validation.front.email',
		min_length: createI18nEntry('validation.front.min_length', {
			field: '{field}',
			min: '{min}',
			current: '{current}',
		}),
		max_length: createI18nEntry('validation.front.max_length', {
			field: '{field}',
			max: '{max}',
			current: '{current}',
		}),
		matches: createI18nEntry('validation.front.matches', { other: '{other}' }),
		one_of: createI18nEntry('validation.front.one_of', { field: '{field}' }),
		slug_format: createI18nEntry('validation.front.slug_format', { field: '{field}' }),
		api_rate_limit: createI18nEntry('validation.front.api_rate_limit.positive_integer', { field: '{field}' }),
		fields: {
			api_rate_limit: 'validation.front.fields.api_rate_limit',
		},
	},
};

/**
 * Shape of the resolved translation payload shared with every Inertia page.
 */
export type CommonTranslations = BuildPayloadResult<typeof COMMON_MAPPING>;

/**
 * Builds the translation payload shared with every Inertia page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The shared `t` object with every generic string resolved.
 */
export function buildCommonPayload(i18n: I18nTranslator): CommonTranslations {
	return i18n.buildPayload(COMMON_MAPPING);
}
