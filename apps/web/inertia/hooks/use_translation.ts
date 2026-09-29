import type { TranslationNodes } from '#transport/core/helpers/translation_tree';

type Format = 'long' | 'full' | 'medium' | 'short';
export type Lang = 'en' | 'fr';

export const locales: Lang[] = ['fr', 'en'];

type Paths<T> = T extends string
	? never
	: {
			[K in keyof T & string]: T[K] extends string ? K : K | `${K}.${Paths<T[K]>}`;
		}[keyof T & string];

/**
 * A lightweight translation hook for AdonisJS (SSR/Client).
 * Handles typed key lookup, dynamic variable injection, and pluralization.
 */
export function useTranslation<T extends TranslationNodes>(
	translations: T,
): {
	t: (path: Paths<T>, data?: Record<string, any>) => string;
	format: (value: any, format: Format, lng: Lang, options?: Record<string, string>) => any;
} {
	const t = (path: Paths<T>, data?: Record<string, any>): string => {
		if (!path || typeof path !== 'string') return data?.defaultValue ?? '';
		const keys = path.split('.');
		let result: any = translations;
		const count = data?.count;

		// 1. Navigation logic
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const isLastKey = i === keys.length - 1;

			if (result && typeof result === 'object' && key in result) {
				// If it's the last key and 'count' is provided, check for plural suffixes
				if (isLastKey && count !== undefined) {
					const suffix = count === 1 ? '_one' : '_other';
					if (result[`${key}${suffix}`] !== undefined) {
						result = result[`${key}${suffix}`];
						break;
					}
				}
				result = result[key];
			} else {
				return data?.defaultValue ?? (path as string);
			}
		}

		if (typeof result !== 'string') return data?.defaultValue ?? (path as string);
		if (!data) return result;

		// 2. Placeholder replacement {variable}
		return result.replace(/\{(\w+)\}/g, (match, key) => {
			return data[key] !== undefined ? String(data[key]) : match;
		});
	};

	const format = (value: any, format_name: Format, lng: Lang, options?: Record<string, string>) => {
		if (value instanceof Date) {
			return new Intl.DateTimeFormat(lng, {
				dateStyle: format_name || 'long',
				...(options?.withTime && { timeStyle: 'short' }),
			}).format(value);
		}
		return value;
	};

	return { t, format };
}
