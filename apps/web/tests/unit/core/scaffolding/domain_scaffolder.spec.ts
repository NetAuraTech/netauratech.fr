import { test } from '@japa/runner';
import {
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

const routesSeed = `import '#transport/log/routes';\n`;

const permissionsSeed = `import { loggingPermissionCatalog } from '#log/permissions';\n\nconst permissionCatalog = {\n\t...loggingPermissionCatalog,\n};\n`;

const navSeed = `import { loggingNavEntries } from '#transport/log/nav';\n\nregistry.register('logging', loggingNavEntries);\n`;

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
	test('applyRoutesRegistration() adds the domain route import after the log import', ({ assert }) => {
		const once = applyRoutesRegistration(routesSeed, widgetNames);
		const twice = applyRoutesRegistration(once, widgetNames);

		assert.include(once, "import '#transport/widget/routes';");
		assert.equal(once.match(/import '#transport\/[a-z]+\/routes';/g)?.length ?? 0, 2);
		assert.equal(once, twice);
	});

	test('applyPermissionsRegistration() adds the catalog import and spread', ({ assert }) => {
		const once = applyPermissionsRegistration(permissionsSeed, widgetNames);
		const twice = applyPermissionsRegistration(once, widgetNames);

		assert.include(once, "import { WidgetPermissionCatalog } from '#widget/permissions';");
		assert.include(once, '\t...WidgetPermissionCatalog,');
		assert.equal(once, twice);
	});

	test('applyNavRegistration() adds the nav import and registration', ({ assert }) => {
		const once = applyNavRegistration(navSeed, widgetNames);
		const twice = applyNavRegistration(once, widgetNames);

		assert.include(once, "import { widgetNavEntries } from '#transport/widget/nav';");
		assert.include(once, "registry.register('widget', widgetNavEntries);");
		assert.equal(once, twice);
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

	test('registration edits are no-ops when the domain is already registered', ({ assert }) => {
		const routesAlready = "import '#transport/log/routes';\nimport '#transport/widget/routes';\n";

		assert.equal(applyRoutesRegistration(routesAlready, widgetNames), routesAlready);

		const permissionsAlready = `import { loggingPermissionCatalog } from '#log/permissions';\nimport { WidgetPermissionCatalog } from '#widget/permissions';\n\nconst permissionCatalog = {\n\t...loggingPermissionCatalog,\n\t...WidgetPermissionCatalog,\n};\n`;

		assert.equal(applyPermissionsRegistration(permissionsAlready, widgetNames), permissionsAlready);

		const navAlready = `import { loggingNavEntries } from '#transport/log/nav';\nimport { widgetNavEntries } from '#transport/widget/nav';\n\nregistry.register('logging', loggingNavEntries);\nregistry.register('widget', widgetNavEntries);\n`;

		assert.equal(applyNavRegistration(navAlready, widgetNames), navAlready);
	});
});
