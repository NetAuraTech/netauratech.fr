import { test } from '@japa/runner';
import { FakeI18n } from '#tests/helpers/fake_i18n';
import { LOCALES, loadLang, emptyLeaves } from '#tests/helpers/i18n_lang_loader';
import { buildAcceptInvitationPayload } from '#transport/auth/helpers/i18n_payloads/accept_invitation';
import { buildForgotPasswordPayload } from '#transport/auth/helpers/i18n_payloads/forgot_password';
import { buildRegisterPayload } from '#transport/auth/helpers/i18n_payloads/register';
import { buildResetPasswordPayload } from '#transport/auth/helpers/i18n_payloads/reset_password';
import { buildSessionPayload } from '#transport/auth/helpers/i18n_payloads/session';
import { buildSocialDefinePasswordPayload } from '#transport/auth/helpers/i18n_payloads/social_define_password';
import { I18nService } from '#transport/core/helpers/i18n_service';
import type { I18n } from '@adonisjs/i18n';

const BUILDER_IDS = [
	'session',
	'social_define_password',
	'forgot_password',
	'reset_password',
	'register',
	'accept_invitation',
] as const;

/**
 * Runs a single auth builder for the request-scoped i18n and returns its
 * payload. Exhaustive over every auth payload builder so a newly added
 * builder fails this suite until it is covered.
 */
function buildById(i18n: I18nService, id: (typeof BUILDER_IDS)[number]): any {
	switch (id) {
		case 'session':
			return buildSessionPayload(i18n);
		case 'social_define_password':
			return buildSocialDefinePasswordPayload(i18n);
		case 'forgot_password':
			return buildForgotPasswordPayload(i18n);
		case 'reset_password':
			return buildResetPasswordPayload(i18n);
		case 'register':
			return buildRegisterPayload(i18n);
		case 'accept_invitation':
			return buildAcceptInvitationPayload(i18n, 'user@example.com');
	}
}

test.group('i18n payload lang coverage (auth)', () => {
	test('covers every auth payload builder', ({ assert }) => {
		assert.lengthOf(BUILDER_IDS, 6);
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
