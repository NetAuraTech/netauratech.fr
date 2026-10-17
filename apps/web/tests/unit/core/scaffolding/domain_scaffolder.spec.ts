import { readFileSync } from 'node:fs';
import { test } from '@japa/runner';
import ScaffolderRegistrationException from '#core/exceptions/scaffolder_registration_exception';
import {
	NAV_IMPORTS_MARKER,
	NAV_REGISTRATION_MARKER,
	PERMISSIONS_CATALOG_MARKER,
	PERMISSIONS_IMPORTS_MARKER,
	ROUTES_IMPORTS_MARKER,
	applyNavRegistration,
	applyPackageImportsRegistration,
	applyPermissionsRegistration,
	applyRoutesRegistration,
	buildDomainFiles,
	deriveNames,
	pluralize,
} from '#core/scaffolding/domain_scaffolder';

const widgetNames = deriveNames('widget');

if (!widgetNames) {
	throw new Error('deriveNames("widget") unexpectedly returned null');
}

/**
 * Unit tests for the pure `make:domain` scaffolding logic shared by the
 * `make:domain` ace command and its generated-file templates.
 */
test.group('domain scaffolder naming', () => {
	test('deriveNames() derives the full name set from a singular snake_case word', ({ assert }) => {
		assert.deepEqual(widgetNames, {
			domain: 'widget',
			entities: 'widgets',
			Entity: 'Widget',
			Entities: 'Widgets',
			domainAlias: '#widget',
			permissionCatalogName: 'WidgetPermissionCatalog',
			navEntriesName: 'widgetNavEntries',
		});
	});

	test('deriveNames() normalizes kebab-case input to snake_case', ({ assert }) => {
		assert.equal(deriveNames('my-widget')?.domain, 'my_widget');
		assert.equal(deriveNames('my-widget')?.Entity, 'MyWidget');
		assert.equal(deriveNames('my-widget')?.entities, 'my_widgets');
	});

	test('deriveNames() rejects invalid inputs', ({ assert }) => {
		for (const input of ['', 'Widget', 'foo bar', '9foo', 'foo!']) {
			assert.isNull(deriveNames(input), `expected ${JSON.stringify(input)} to be rejected`);
		}

		assert.isNotNull(deriveNames('foo_bar_9'));
	});

	test('pluralize() follows the simple English rules', ({ assert }) => {
		assert.equal(pluralize('widget'), 'widgets');
		assert.equal(pluralize('box'), 'boxes');
		assert.equal(pluralize('watch'), 'watches');
		assert.equal(pluralize('dish'), 'dishes');
		assert.equal(pluralize('city'), 'cities');
		assert.equal(pluralize('day'), 'days');
	});
});

test.group('domain scaffolder file set', () => {
	test('buildDomainFiles() returns one file per scaffolded concern', ({ assert }) => {
		const paths = buildDomainFiles(widgetNames, { timestamp: 999 }).map((file) => file.path);

		assert.equal(paths.length, 30);
		assert.deepEqual(paths.filter((path) => path.startsWith('src/widget/')).sort(), [
			'src/widget/actions/widget/create_widget_action.ts',
			'src/widget/actions/widget/delete_widget_action.ts',
			'src/widget/actions/widget/list_widgets_action.ts',
			'src/widget/domain/identifiers.ts',
			'src/widget/domain/widget.ts',
			'src/widget/models/widget.ts',
			'src/widget/permissions.ts',
			'src/widget/queries/list_widgets_query.ts',
			'src/widget/repositories/widget_repository.ts',
			'src/widget/services/widget_service.ts',
			'src/widget/types/widget.ts',
		]);
		assert.deepEqual(paths.filter((path) => path.startsWith('app/widget/')).sort(), [
			'app/widget/controllers/admin/routes.ts',
			'app/widget/controllers/admin/widgets_controller.ts',
			'app/widget/controllers/api/routes.ts',
			'app/widget/controllers/api/widgets_api_controller.ts',
			'app/widget/controllers/api/widgets_create_api_controller.ts',
			'app/widget/controllers/api/widgets_delete_api_controller.ts',
			'app/widget/helpers/i18n_payloads/widgets_list.ts',
			'app/widget/nav.ts',
			'app/widget/rest/widgets_resource.ts',
			'app/widget/routes.ts',
			'app/widget/transformers/widget_transformer.ts',
			'app/widget/validators/widget.ts',
		]);
		assert.deepEqual(paths.filter((path) => path.startsWith('inertia/')).sort(), [
			'inertia/pages/widget/admin/index.tsx',
		]);
		assert.deepEqual(paths.filter((path) => path.startsWith('resources/')).sort(), [
			'resources/lang/en/widget.json',
			'resources/lang/fr/widget.json',
		]);
		assert.deepEqual(paths.filter((path) => path.startsWith('database/')).sort(), [
			'database/factories/widget/widget_factory.ts',
			'database/migrations/999_create_widgets_table.ts',
		]);
		assert.deepEqual(paths.filter((path) => path.startsWith('tests/')).sort(), [
			'tests/functional/widget/admin_widgets.spec.ts',
			'tests/unit/widget/domain/widget.spec.ts',
		]);
	});

	test('buildDomainFiles() honors the migration timestamp option', ({ assert }) => {
		const migration = buildDomainFiles(widgetNames, { timestamp: 1720000000000 }).find((file) =>
			file.path.includes('migrations'),
		);

		assert.equal(migration?.path, 'database/migrations/1720000000000_create_widgets_table.ts');
	});

	test('buildDomainFiles() interpolates the derived names into every layer', ({ assert }) => {
		const byPath = new Map(buildDomainFiles(widgetNames).map((file) => [file.path, file.content]));

		assert.include(byPath.get('src/widget/models/widget.ts') ?? '', 'class Widget extends WidgetSchema');
		assert.include(byPath.get('src/widget/permissions.ts') ?? '', 'export const WidgetPermissionCatalog = {');
		assert.include(byPath.get('src/widget/queries/list_widgets_query.ts') ?? '', 'ListWidgetsQuery');
		assert.include(
			byPath.get('app/widget/helpers/i18n_payloads/widgets_list.ts') ?? '',
			"title: 'widget.admin.list.title'",
		);
		assert.include(
			byPath.get('app/widget/validators/widget.ts') ?? '',
			'export const deleteWidgetValidator = vine.create({',
		);
		assert.include(byPath.get('resources/lang/en/widget.json') ?? '', '"title": "Widgets"');
	});

	test('buildDomainFiles() keeps the business layer free of transport imports in templates', ({ assert }) => {
		for (const file of buildDomainFiles(widgetNames)) {
			if (!file.path.startsWith('src/')) continue;

			assert.notInclude(file.content, '#transport/');
			assert.notInclude(file.content, "from 'app/");
		}
	});
});

// Seeds mirroring the committed `start/` composition files: every pinned marker
// in its documented position (right after the logging registration, the last
// pinned anchor line).
const routesSeed = `import '#transport/log/routes';\n${ROUTES_IMPORTS_MARKER}\nimport '#transport/webhook/routes';\n`;

const routesOnce = `import '#transport/log/routes';\n${ROUTES_IMPORTS_MARKER}\nimport '#transport/widget/routes';\nimport '#transport/webhook/routes';\n`;

const permissionsSeed = `import { loggingPermissionCatalog } from '#log/permissions';\n${PERMISSIONS_IMPORTS_MARKER}\n\nexport const permissionCatalog = {\n\t...loggingPermissionCatalog,\n${PERMISSIONS_CATALOG_MARKER}\n\t...webhookPermissionCatalog,\n};\n`;

const permissionsOnce = `import { loggingPermissionCatalog } from '#log/permissions';\n${PERMISSIONS_IMPORTS_MARKER}\nimport { WidgetPermissionCatalog } from '#widget/permissions';\n\nexport const permissionCatalog = {\n\t...loggingPermissionCatalog,\n${PERMISSIONS_CATALOG_MARKER}\n\t...WidgetPermissionCatalog,\n\t...webhookPermissionCatalog,\n};\n`;

const navSeed = `import { loggingNavEntries } from '#transport/log/nav';\n${NAV_IMPORTS_MARKER}\nimport { webhookNavEntries } from '#transport/webhook/nav';\n\nregistry.register('logging', loggingNavEntries);\n${NAV_REGISTRATION_MARKER}\nregistry.register('webhook', webhookNavEntries);\n`;

const navOnce = `import { loggingNavEntries } from '#transport/log/nav';\n${NAV_IMPORTS_MARKER}\nimport { widgetNavEntries } from '#transport/widget/nav';\nimport { webhookNavEntries } from '#transport/webhook/nav';\n\nregistry.register('logging', loggingNavEntries);\n${NAV_REGISTRATION_MARKER}\nregistry.register('widget', widgetNavEntries);\nregistry.register('webhook', webhookNavEntries);\n`;

const packageSeed = JSON.stringify(
	{
		imports: {
			'#backup/*': './src/backup/*.js',
			'#log/*': './src/log/*.js',
		},
	},
	null,
	2,
);

test.group('domain scaffolder registrations', () => {
	test('applyRoutesRegistration() splices the route import at the routes-imports marker', ({ assert }) => {
		const once = applyRoutesRegistration(routesSeed, widgetNames);
		const twice = applyRoutesRegistration(once, widgetNames);

		assert.equal(once, routesOnce);
		assert.equal(twice, once);
	});

	test('applyPermissionsRegistration() splices the catalog import and spread at their markers', ({ assert }) => {
		const once = applyPermissionsRegistration(permissionsSeed, widgetNames);
		const twice = applyPermissionsRegistration(once, widgetNames);

		assert.equal(once, permissionsOnce);
		assert.equal(twice, once);
	});

	test('applyNavRegistration() splices the nav import and registration at their markers', ({ assert }) => {
		const once = applyNavRegistration(navSeed, widgetNames);
		const twice = applyNavRegistration(once, widgetNames);

		assert.equal(once, navOnce);
		assert.equal(twice, once);
	});

	test('applyPackageImportsRegistration() inserts the domain alias after #backup/*', ({ assert }) => {
		const once = applyPackageImportsRegistration(packageSeed, widgetNames);
		const twice = applyPackageImportsRegistration(once, widgetNames);

		const parsed = JSON.parse(once) as { imports: Record<string, string> };

		assert.equal(parsed.imports['#widget/*'], './src/widget/*.js');
		assert.deepEqual(
			Object.entries(parsed.imports).map(([key]) => key),
			['#backup/*', '#widget/*', '#log/*'],
		);
		assert.equal(once, twice);
	});

	test('registration edits are no-ops when the domain is fully registered', ({ assert }) => {
		assert.equal(applyRoutesRegistration(routesOnce, widgetNames), routesOnce);
		assert.equal(applyPermissionsRegistration(permissionsOnce, widgetNames), permissionsOnce);
		assert.equal(applyNavRegistration(navOnce, widgetNames), navOnce);
	});

	test('applyPermissionsRegistration() completes a half-applied registration at the missing marker', ({ assert }) => {
		// Import present, spread missing: the old sentinel guard short-circuited
		// and left the catalog unregistered. The marker contract completes it.
		const halfApplied = `import { loggingPermissionCatalog } from '#log/permissions';\n${PERMISSIONS_IMPORTS_MARKER}\nimport { WidgetPermissionCatalog } from '#widget/permissions';\n\nexport const permissionCatalog = {\n\t...loggingPermissionCatalog,\n${PERMISSIONS_CATALOG_MARKER}\n\t...webhookPermissionCatalog,\n};\n`;

		assert.equal(applyPermissionsRegistration(halfApplied, widgetNames), permissionsOnce);
	});

	test('applyNavRegistration() completes a half-applied registration at the missing marker', ({ assert }) => {
		// Import present, register() call missing: the old sentinel guard
		// short-circuited and left the entries unregistered. It is completed.
		const halfApplied = `import { loggingNavEntries } from '#transport/log/nav';\n${NAV_IMPORTS_MARKER}\nimport { widgetNavEntries } from '#transport/widget/nav';\nimport { webhookNavEntries } from '#transport/webhook/nav';\n\nregistry.register('logging', loggingNavEntries);\n${NAV_REGISTRATION_MARKER}\nregistry.register('webhook', webhookNavEntries);\n`;

		assert.equal(applyNavRegistration(halfApplied, widgetNames), navOnce);
	});

	test('a missing marker throws an actionable ScaffolderRegistrationException', ({ assert }) => {
		assert.throws(
			() => applyRoutesRegistration(`import '#transport/log/routes';\n`, widgetNames),
			ScaffolderRegistrationException,
			ROUTES_IMPORTS_MARKER,
		);

		const noImportMarker = `import { loggingPermissionCatalog } from '#log/permissions';\n\nexport const permissionCatalog = {\n\t...loggingPermissionCatalog,\n${PERMISSIONS_CATALOG_MARKER}\n\t...webhookPermissionCatalog,\n};\n`;
		assert.throws(
			() => applyPermissionsRegistration(noImportMarker, widgetNames),
			ScaffolderRegistrationException,
			PERMISSIONS_IMPORTS_MARKER,
		);

		const noCatalogMarker = `import { loggingPermissionCatalog } from '#log/permissions';\n${PERMISSIONS_IMPORTS_MARKER}\n\nexport const permissionCatalog = {\n\t...loggingPermissionCatalog,\n\t...webhookPermissionCatalog,\n};\n`;
		assert.throws(
			() => applyPermissionsRegistration(noCatalogMarker, widgetNames),
			ScaffolderRegistrationException,
			PERMISSIONS_CATALOG_MARKER,
		);

		const noNavImportMarker = `import { loggingNavEntries } from '#transport/log/nav';\nimport { webhookNavEntries } from '#transport/webhook/nav';\n\nregistry.register('logging', loggingNavEntries);\n${NAV_REGISTRATION_MARKER}\nregistry.register('webhook', webhookNavEntries);\n`;
		assert.throws(
			() => applyNavRegistration(noNavImportMarker, widgetNames),
			ScaffolderRegistrationException,
			NAV_IMPORTS_MARKER,
		);

		const noNavRegistrationMarker = `import { loggingNavEntries } from '#transport/log/nav';\n${NAV_IMPORTS_MARKER}\nimport { webhookNavEntries } from '#transport/webhook/nav';\n\nregistry.register('logging', loggingNavEntries);\nregistry.register('webhook', webhookNavEntries);\n`;
		assert.throws(
			() => applyNavRegistration(noNavRegistrationMarker, widgetNames),
			ScaffolderRegistrationException,
			NAV_REGISTRATION_MARKER,
		);
	});

	test('the error names the composition file it is missing from', ({ assert }) => {
		try {
			applyRoutesRegistration(`import '#transport/log/routes';\n`, widgetNames);
			assert.fail('expected applyRoutesRegistration() to throw');
		} catch (error) {
			assert.instanceOf(error, ScaffolderRegistrationException);
			assert.include((error as Error).message, 'start/routes.ts');
		}
	});
});

/** Read a tracked composition file relative to the app root (four levels up from this spec). */
const readComposition = (file: string): string => readFileSync(new URL(`../../../../${file}`, import.meta.url), 'utf8');

test.group('domain scaffolder marker contract', () => {
	test('every composition file carries each pinned marker exactly once', ({ assert }) => {
		const routes = readComposition('start/routes.ts');
		assert.equal(
			routes.split(ROUTES_IMPORTS_MARKER).length,
			2,
			'start/routes.ts must carry the routes-imports marker exactly once',
		);

		const permissions = readComposition('start/permissions.ts');
		assert.equal(
			permissions.split(PERMISSIONS_IMPORTS_MARKER).length,
			2,
			'start/permissions.ts must carry the permissions-imports marker exactly once',
		);
		assert.equal(
			permissions.split(PERMISSIONS_CATALOG_MARKER).length,
			2,
			'start/permissions.ts must carry the permissions-catalog marker exactly once',
		);

		const nav = readComposition('start/nav.ts');
		assert.equal(
			nav.split(NAV_IMPORTS_MARKER).length,
			2,
			'start/nav.ts must carry the nav-imports marker exactly once',
		);
		assert.equal(
			nav.split(NAV_REGISTRATION_MARKER).length,
			2,
			'start/nav.ts must carry the nav-registration marker exactly once',
		);
	});

	test('a scaffolded registration applies to the committed composition files without error', ({ assert }) => {
		const routes = readComposition('start/routes.ts');
		assert.include(applyRoutesRegistration(routes, widgetNames), "import '#transport/widget/routes';");

		const permissions = readComposition('start/permissions.ts');
		assert.include(applyPermissionsRegistration(permissions, widgetNames), '\t...WidgetPermissionCatalog,');

		const nav = readComposition('start/nav.ts');
		assert.include(applyNavRegistration(nav, widgetNames), "registry.register('widget', widgetNavEntries);");
	});
});
