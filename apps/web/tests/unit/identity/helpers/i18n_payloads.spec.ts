import { test } from '@japa/runner';
import { FakeI18n } from '#tests/helpers/fake_i18n';
import { LOCALES, loadLang, emptyLeaves } from '#tests/helpers/i18n_lang_loader';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { buildPermissionsFormPayload } from '#transport/identity/helpers/i18n_payloads/permissions_form';
import { buildPermissionsListPayload } from '#transport/identity/helpers/i18n_payloads/permissions_list';
import { buildRolesFormPayload } from '#transport/identity/helpers/i18n_payloads/roles_form';
import { buildRolesListPayload } from '#transport/identity/helpers/i18n_payloads/roles_list';
import { buildRolesShowPayload } from '#transport/identity/helpers/i18n_payloads/roles_show';
import { buildUsersFormPayload } from '#transport/identity/helpers/i18n_payloads/users_form';
import { buildUsersListPayload } from '#transport/identity/helpers/i18n_payloads/users_list';
import { buildUsersShowPayload } from '#transport/identity/helpers/i18n_payloads/users_show';
import type Permission from '#identity/models/permission';
import type Role from '#identity/models/role';
import type { I18n } from '@adonisjs/i18n';

// Dummy domain records whose slugs map to keys that exist in both locales.
const DUMMY_ROLE = {
	slug: 'admin',
	name: 'roles.admin.value',
	description: 'roles.admin.description',
} as unknown as Role;

const DUMMY_PERMISSION = {
	slug: 'users.view',
	name: 'permissions.users.view.value',
	description: 'permissions.users.view.description',
	category: 'permissions.category.users',
} as unknown as Permission;

const BUILDER_IDS = [
	'roles_list',
	'roles_form',
	'roles_show',
	'permissions_list',
	'permissions_form',
	'users_list',
	'users_form',
	'users_show',
] as const;

/**
 * Runs a single identity builder for the request-scoped i18n and returns its
 * payload. Exhaustive over every identity payload builder so a newly added
 * builder fails this suite until it is covered.
 */
function buildById(i18n: I18nService, id: (typeof BUILDER_IDS)[number]): any {
	switch (id) {
		case 'roles_list':
			return buildRolesListPayload(i18n, [DUMMY_ROLE]);
		case 'roles_form':
			return buildRolesFormPayload(i18n, [DUMMY_PERMISSION]);
		case 'roles_show':
			return buildRolesShowPayload(i18n, DUMMY_ROLE, [DUMMY_PERMISSION]);
		case 'permissions_list':
			return buildPermissionsListPayload(i18n, [DUMMY_PERMISSION]);
		case 'permissions_form':
			return buildPermissionsFormPayload(i18n);
		case 'users_list':
			return buildUsersListPayload(i18n, [DUMMY_ROLE]);
		case 'users_form':
			return buildUsersFormPayload(i18n, [DUMMY_ROLE]);
		case 'users_show':
			return buildUsersShowPayload(i18n, DUMMY_ROLE, [DUMMY_PERMISSION]);
	}
}

test.group('i18n payload lang coverage (identity)', () => {
	test('covers every identity payload builder', ({ assert }) => {
		assert.lengthOf(BUILDER_IDS, 8);
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
