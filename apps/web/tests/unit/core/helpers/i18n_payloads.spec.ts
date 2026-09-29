import { test } from '@japa/runner';
import { FakeI18n } from '#tests/helpers/fake_i18n';
import { LOCALES, loadLang, emptyLeaves } from '#tests/helpers/i18n_lang_loader';
import { buildCommonPayload } from '#transport/core/helpers/i18n_payloads/common';
import { buildDashboardPayload } from '#transport/core/helpers/i18n_payloads/dashboard';
import { buildHomePayload } from '#transport/core/helpers/i18n_payloads/home';
import { buildMaintenanceIndexPayload } from '#transport/core/helpers/i18n_payloads/maintenance_front';
import { buildAdminMaintenanceIndexPayload } from '#transport/core/helpers/i18n_payloads/maintenance_index';
import { I18nService } from '#transport/core/helpers/i18n_service';
import type { I18n } from '@adonisjs/i18n';

const BUILDER_IDS = ['home', 'dashboard', 'admin_maintenance_index', 'maintenance_index', 'common'] as const;

/**
 * Runs a single core builder for the request-scoped i18n and returns its
 * payload. Exhaustive over every core payload builder so a newly added
 * builder fails this suite until it is covered.
 */
function buildById(i18n: I18nService, id: (typeof BUILDER_IDS)[number]): any {
	switch (id) {
		case 'home':
			return buildHomePayload(i18n);
		case 'dashboard':
			return buildDashboardPayload(i18n);
		case 'admin_maintenance_index':
			return buildAdminMaintenanceIndexPayload(i18n);
		case 'maintenance_index':
			return buildMaintenanceIndexPayload(i18n);
		case 'common':
			return buildCommonPayload(i18n);
	}
}

test.group('i18n payload lang coverage (core)', () => {
	test('covers every core payload builder', ({ assert }) => {
		assert.lengthOf(BUILDER_IDS, 5);
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
