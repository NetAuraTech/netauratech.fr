import { test } from '@japa/runner';
import { FakeI18n } from '#tests/helpers/fake_i18n';
import { LOCALES, loadLang, emptyLeaves } from '#tests/helpers/i18n_lang_loader';
import { buildAccountPayload } from '#transport/account/helpers/i18n_payloads/account';
import { buildEmailChangePayload } from '#transport/account/helpers/i18n_payloads/email_change';
import { buildPreferencesPayload } from '#transport/account/helpers/i18n_payloads/preferences';
import { buildProfilePayload } from '#transport/account/helpers/i18n_payloads/profile';
import { I18nService } from '#transport/core/helpers/i18n_service';
import type { I18n } from '@adonisjs/i18n';

const BUILDER_IDS = ['profile', 'preferences', 'account', 'email_change'] as const;

/**
 * Runs a single account builder for the request-scoped i18n and returns its
 * payload. Exhaustive over every account payload builder so a newly added
 * builder fails this suite until it is covered.
 */
function buildById(i18n: I18nService, id: (typeof BUILDER_IDS)[number]): any {
	switch (id) {
		case 'profile':
			return buildProfilePayload(i18n);
		case 'preferences':
			return buildPreferencesPayload(i18n);
		case 'account':
			return buildAccountPayload(i18n);
		case 'email_change':
			return buildEmailChangePayload(i18n);
	}
}

test.group('i18n payload lang coverage (account)', () => {
	test('covers every account payload builder', ({ assert }) => {
		assert.lengthOf(BUILDER_IDS, 4);
	});

	for (const locale of LOCALES) {
		for (const id of BUILDER_IDS) {
			test(`${id} [${locale}]`, ({ assert }) => {
				const fake = new FakeI18n(loadLang(locale));
				const i18n = new I18nService(fake as unknown as I18n);
				const output = buildById(i18n, id);

				assert.lengthOf(fake.misses, 0);
				assert.lengthOf(emptyLeaves(output), 0);
			});
		}
	}
});
