import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { BaseCommand } from '@adonisjs/core/ace';
import {
	applyNavRegistration,
	applyPackageImportsRegistration,
	applyPermissionsRegistration,
	applyRoutesRegistration,
	buildDomainFiles,
	deriveNames,
} from '#core/scaffolding/domain_scaffolder';
import type { CommandOptions } from '@adonisjs/core/types/ace';

/**
 * Ace command that scaffolds a complete DDD domain end to end.
 *
 * Generates the business layer (`src/{domain}/`), the transport layer
 * (`app/{domain}/`), the frontend page and translations, the migration,
 * factory and tests, and wires the domain into the app through four
 * idempotent registration edits: `start/routes.ts`, `start/permissions.ts`,
 * `start/nav.ts` and the `package.json` imports map.
 *
 * Safe to run repeatedly for the same domain: nothing is overridden and the
 * registration edits are idempotent, so a partial generation can be retried
 * after removing the conflicting files.
 *
 * @example
 * node ace make:domain
 */
export default class MakeDomain extends BaseCommand {
	static commandName = 'make:domain';
	static description = 'Scaffold a complete DDD domain end to end';

	static options: CommandOptions = {
		startApp: false,
		allowUnknownFlags: false,
	};

	async run() {
		const raw = await this.prompt.ask('What is the domain name? (singular, lowercase — e.g. "widget")', {
			validate: (value) => {
				const names = deriveNames(value);
				return names ? true : 'Use a single lowercase word (a-z, 0-9, underscores).';
			},
		});

		const names = deriveNames(raw);

		if (!names) {
			this.logger.error('Invalid domain name.');
			this.exitCode = 1;
			return;
		}

		const files = buildDomainFiles(names);

		const existing = files.map((file) => this.app.makePath(file.path)).filter((filePath) => existsSync(filePath));

		if (existing.length > 0) {
			this.logger.error('Refusing to overwrite existing files:');
			for (const filePath of existing) this.logger.error(`  ${filePath}`);
			this.exitCode = 1;
			return;
		}

		this.logger.info(
			[
				`Domain       ${names.domain}`,
				`Entities     ${names.Entities}`,
				`Table        ${names.entities}`,
				`Permission   ${names.entities}.view/create/delete`,
				`Admin URL    /admin/${names.entities}`,
				`API URL      /api/v1/admin/${names.entities}`,
				`Files        ${files.length}`,
			].join('\n  '),
		);

		const confirmed = await this.prompt.confirm('Generate the domain scaffold now?');

		if (!confirmed) {
			this.logger.info('Aborted; nothing was written.');
			return;
		}

		try {
			for (const file of files) {
				const filePath = this.app.makePath(file.path);
				mkdirSync(dirname(filePath), { recursive: true });
				writeFileSync(filePath, file.content, 'utf8');
				this.logger.success(`Created ${file.path}`);
			}

			this.applyRegistration('start/routes.ts', (content) => applyRoutesRegistration(content, names));
			this.applyRegistration('start/permissions.ts', (content) => applyPermissionsRegistration(content, names));
			this.applyRegistration('start/nav.ts', (content) => applyNavRegistration(content, names));
			this.applyRegistration('package.json', (content) => applyPackageImportsRegistration(content, names));

			this.logger.success(`Domain "${names.domain}" scaffolded.`);
			this.logger.info(
				[
					'Next steps (from the app workspace):',
					`  1. ${this.colors.cyan('node ace codegen')} — regenerate codegen artifacts (imports, controllers, data)`,
					`  2. ${this.colors.cyan('node ace migration:run')} — run the migration and regenerate database/schema.ts`,
					`  3. ${this.colors.cyan('npm run typecheck')} — verify types across app and Inertia`,
					`  4. ${this.colors.cyan('npm run lint && npm run format:check')} — lint and format the generated files`,
					`  5. ${this.colors.cyan('npm run test')} — run the generated unit and functional tests`,
				].join('\n'),
			);
		} catch (error) {
			this.logger.error(error instanceof Error ? error.message : 'An unexpected error occurred while scaffolding.');
			if (error instanceof Error) this.logger.debug(error.stack ?? '');
			this.exitCode = 1;
		}
	}

	/**
	 * Apply an idempotent registration edit to a tracked file, logging when it
	 * actually changed the file.
	 *
	 * @param file - App-relative path of the file to edit.
	 * @param edit - The pure registration transformation.
	 */
	private applyRegistration<TFile extends 'start/routes.ts' | 'start/permissions.ts' | 'start/nav.ts' | 'package.json'>(
		file: TFile,
		edit: (content: string) => string,
	): void {
		const filePath = this.app.makePath(file);
		const before = readFileSync(filePath, 'utf8');
		const after = edit(before);

		if (after === before) return;

		writeFileSync(filePath, after, 'utf8');
		this.logger.success(`Updated ${file}`);
	}
}
