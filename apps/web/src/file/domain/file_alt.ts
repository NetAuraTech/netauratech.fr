import { ValueObject } from '#core/domain/value_object';

/**
 * Pure domain object for a localized alt-text entry of a file.
 *
 * A {@link FileAlt} is a value object keyed by `(locale, key)`. The `key` is
 * the named intent (e.g. `"hero"`) and `value` is the localized string. The
 * Lucid `FileAlt` model is the persistence representation; hydrate one from a
 * model with {@link FileAlt.fromModel}.
 */
export class FileAlt extends ValueObject<{ locale: string; key: string; value: string }> {
	private constructor(
		readonly locale: string,
		readonly key: string,
		readonly value: string,
	) {
		super({ locale, key, value });
	}

	/**
	 * Hydrate a domain alt entry from its Lucid model representation.
	 *
	 * @param model - The persisted alt entry.
	 */
	static fromModel(model: { locale: string; key: string; value: string }): FileAlt {
		return new FileAlt(model.locale, model.key, model.value);
	}

	/** Whether this entry matches a locale and alt key exactly. */
	matches(locale: string, key: string): boolean {
		return this.locale === locale && this.key === key;
	}

	/** Whether this entry carries the given alt key, in any locale. */
	matchesKey(key: string): boolean {
		return this.key === key;
	}
}
