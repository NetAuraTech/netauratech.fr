import { belongsTo, column } from '@adonisjs/lucid/orm';
import { UserPreference as UserPreferenceDomain } from '#account/domain/preferences';
import { UserPreferenceSchema } from '#database/schema';
import User from '#identity/models/user';
import type { Locale, Theme } from '#account/types/preferences';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

export default class UserPreference extends UserPreferenceSchema {
	/** The user's preferred color scheme. */
	@column()
	declare theme: Theme;

	/** The user's preferred interface language. */
	@column()
	declare locale: Locale;

	@belongsTo(() => User)
	declare user: BelongsTo<typeof User>;

	/**
	 * Project this model onto its pure domain representation. The resolved
	 * theme and locale live on the domain object, which falls back to the
	 * defaults for absent values.
	 */
	toDomain(): UserPreferenceDomain {
		return UserPreferenceDomain.fromModel({
			theme: this.theme,
			locale: this.locale,
		});
	}
}
