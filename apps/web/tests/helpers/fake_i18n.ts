import type { I18n } from '@adonisjs/i18n';

/**
 * Minimal in-memory stand-in for the request-scoped AdonisJS I18n used by unit
 * tests. Resolves keys against a flat `Record<string, string>` and applies
 * `{var}` replacements. Keys that are missing fall back to the key itself and
 * are recorded in `misses`, so tests can assert complete lang coverage.
 */
export class FakeI18n implements Partial<I18n> {
	public locale = 'en';
	public misses: string[] = [];
	private translations: Record<string, string>;

	constructor(translations?: Record<string, string>) {
		this.translations = translations ?? {};
	}

	/**
	 * Resolves `key` to its stored value (or the key itself when absent) and
	 * substitutes each `{name}` placeholder from `replacements`.
	 */
	t(key: string, replacements?: Record<string, any>): string {
		let result = this.translations[key];
		if (result === undefined) {
			this.misses.push(key);
			result = key;
		}

		if (replacements) {
			for (const [k, v] of Object.entries(replacements)) {
				result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
			}
		}

		return result;
	}
}
