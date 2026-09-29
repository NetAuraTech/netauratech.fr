import { test } from '@japa/runner';
import { FakeI18n } from '#tests/helpers/fake_i18n';
import { LOCALES, loadLang, emptyLeaves } from '#tests/helpers/i18n_lang_loader';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { buildFileFoldersPayload } from '#transport/file/helpers/i18n_payloads/file_folders';
import { buildFilesIndexPayload } from '#transport/file/helpers/i18n_payloads/files_index';
import { buildFilesShowPayload } from '#transport/file/helpers/i18n_payloads/files_show';
import type { I18n } from '@adonisjs/i18n';

const BUILDER_IDS = ['file_folders', 'files_index', 'files_show'] as const;

/**
 * Runs a single file builder for the request-scoped i18n and returns its
 * payload. Exhaustive over every file payload builder so a newly added
 * builder fails this suite until it is covered.
 */
function buildById(i18n: I18nService, id: (typeof BUILDER_IDS)[number]): any {
	switch (id) {
		case 'file_folders':
			return buildFileFoldersPayload(i18n);
		case 'files_index':
			return buildFilesIndexPayload(i18n);
		case 'files_show':
			return buildFilesShowPayload(i18n);
	}
}

test.group('i18n payload lang coverage (file)', () => {
	test('covers every file payload builder', ({ assert }) => {
		assert.lengthOf(BUILDER_IDS, 3);
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
