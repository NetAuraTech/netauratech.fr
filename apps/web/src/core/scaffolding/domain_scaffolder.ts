/**
 * Pure `make:domain` scaffolding logic.
 *
 * Derives every name a new domain needs from a single singular snake_case
 * argument, renders the full set of domain files (business layer, transport
 * layer, migration, factory, Inertia page, translations and tests), and
 * produces the idempotent registration edits (`start/routes.ts`,
 * `start/permissions.ts`, `start/nav.ts` and the `package.json` imports map)
 * that wire the domain into the app.
 *
 * The module is dependency-free and side-effect-free so the `make:domain`
 * command and the scaffolder unit tests share the exact same logic.
 */
export interface DomainNames {
	/** Singular snake_case domain segment (e.g. `widget`), reused as the business import alias. */
	domain: string;
	/** Plural snake_case entities (e.g. `widgets`): table, URL and permission category. */
	entities: string;
	/** PascalCase singular (e.g. `Widget`). */
	Entity: string;
	/** PascalCase plural (e.g. `Widgets`). */
	Entities: string;
	/** The `#<domain>` import alias. */
	domainAlias: string;
	/** Permission catalog const name (e.g. `widgetPermissionCatalog`). */
	permissionCatalogName: string;
	/** Nav entries const name (e.g. `widgetNavEntries`). */
	navEntriesName: string;
}

/** A single file the scaffolder emits, relative to the app root (`apps/web`). */
export interface DomainFile {
	path: string;
	content: string;
}

/** The simple English pluralization used for entity names (`widget` → `widgets`). */
export function pluralize(word: string): string {
	if (/[sxz]$/.test(word) || /(?:ch|sh)$/.test(word)) return `${word}es`;
	if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
	return `${word}s`;
}

/** PascalCase form of a snake_case word (`my_widget` → `MyWidget`). */
export function pascalize(word: string): string {
	return word.replace(/(^|_)([a-z])/g, (_match, _separator, letter) => letter.toUpperCase());
}

/**
 * Derive all domain names from a single singular snake_case argument.
 *
 * @param input - The raw command argument (e.g. `widget` or `my-widget`).
 * @returns The derived {@link DomainNames}, or `null` when the input is not a
 *   valid lowercase single-word identifier.
 */
export function deriveNames(input: string): DomainNames | null {
	const domain = input.trim().replace(/-/g, '_');

	if (!/^[a-z][a-z0-9_]*$/.test(domain)) return null;

	const entities = pluralize(domain);

	return {
		domain,
		entities,
		Entity: pascalize(domain),
		Entities: pascalize(entities),
		domainAlias: `#${domain}`,
		permissionCatalogName: `${pascalize(domain)}PermissionCatalog`,
		navEntriesName: `${domain}NavEntries`,
	};
}

const typesFile = (n: DomainNames): string => `import type { PaginationFilters } from '#types/pagination';

/** Filters accepted by the admin ${n.entities} listing. */
export interface ${n.Entity}ListFilters extends PaginationFilters {
	/** Case-insensitive substring match on the ${n.domain} name. */
	search?: string;
}

/** Persistence input for creating a single ${n.domain}. */
export interface Create${n.Entity}Input {
	name: string;
	description: string | null;
}
`;

const identifiersFile = (n: DomainNames): string => `import { Identifier } from '#core/domain/identifier';

/**
 * ${n.domain}-domain identifier types.
 *
 * Lucid models use numeric primary keys, so the identifier is a thin branded
 * wrapper around a number on the kernel {@link Identifier} base.
 */

/** Identifier of a ${n.Entity}. */
export class ${n.Entity}Identifier extends Identifier<number> {
	private constructor(value: number) {
		super(value);
	}

	/** Wraps a ${n.domain} primary key as a ${n.Entity}Identifier. */
	static of(value: number): ${n.Entity}Identifier {
		return new ${n.Entity}Identifier(value);
	}
}
`;

const domainFile = (n: DomainNames): string => `import { Entity } from '#core/domain/entity';
import { ${n.Entity}Identifier } from '${n.domainAlias}/domain/identifiers';

/**
 * Pure domain object for a ${n.Entity}.
 *
 * Carries the read model of a ${n.domain} (name, optional description,
 * timestamps) outside the persistence layer; the Lucid \`${n.Entity}\` model is
 * its persistence representation. Hydrate one from a model with
 * {@link ${n.Entity}.fromModel}.
 */
export class ${n.Entity} extends Entity<{
	id: ${n.Entity}Identifier;
	name: string;
	description: string | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}> {
	private constructor(
		readonly id: ${n.Entity}Identifier,
		readonly name: string,
		readonly description: string | null,
		readonly createdAt: Date | null,
		readonly updatedAt: Date | null,
	) {
		super({ id, name, description, createdAt, updatedAt });
	}

	/**
	 * Hydrate a domain ${n.domain} from its Lucid model representation.
	 *
	 * @param model - The persisted ${n.domain} row.
	 */
	static fromModel(model: {
		id: number;
		name: string;
		description: string | null;
		createdAt?: Date | null;
		updatedAt?: Date | null;
	}): ${n.Entity} {
		return new ${n.Entity}(
			${n.Entity}Identifier.of(model.id),
			model.name,
			model.description,
			model.createdAt ?? null,
			model.updatedAt ?? null,
		);
	}
}
`;

const modelFile = (n: DomainNames): string => `import { ${n.Entity}Schema } from '#database/schema';
import { ${n.Entity} as ${n.Entity}Domain } from '${n.domainAlias}/domain/${n.domain}';

export default class ${n.Entity} extends ${n.Entity}Schema {
	/**
	 * Project this model onto its pure domain representation.
	 */
	toDomain(): ${n.Entity}Domain {
		return ${n.Entity}Domain.fromModel({
			id: this.id,
			name: this.name,
			description: this.description,
			createdAt: this.createdAt?.toJSDate() ?? null,
			updatedAt: this.updatedAt?.toJSDate() ?? null,
		});
	}
}
`;

const permissionsFile = (n: DomainNames): string => `/**
 * System permission catalog of the ${n.entities} domain.
 *
 * The slug values derive from this const; the permission seeder persists
 * exactly this matrix.
 */
export const ${n.permissionCatalogName} = {
	${n.entities}: ['view', 'create', 'delete'],
} as const;
`;

const repositoryFile = (n: DomainNames): string => `import { BaseRepository } from '#core/repositories/base_repository';
import ${n.Entity} from '${n.domainAlias}/models/${n.domain}';
import type { Create${n.Entity}Input } from '${n.domainAlias}/types/${n.domain}';

/**
 * Handles all database operations for the {@link ${n.Entity}} model.
 *
 * Every method is a thin, focused wrapper around Lucid ORM queries so that
 * callers never interact with the ORM directly.
 */
export class ${n.Entity}Repository extends BaseRepository {
	/**
	 * Fetches a single ${n.domain} by its primary key.
	 *
	 * @param id - The ${n.domain} id.
	 * @returns The matching ${n.Entity}, or \`null\` when not found.
	 *
	 * @example
	 * const ${n.domain} = await ${n.domain}Repository.findById(1)
	 */
	async findById(id: number): Promise<${n.Entity} | null> {
		return await ${n.Entity}.query(this.client()).where('id', id).first();
	}

	/**
	 * Creates a ${n.domain}.
	 *
	 * @param input - The ${n.domain} attributes to persist.
	 * @returns The newly created ${n.Entity}.
	 *
	 * @example
	 * const ${n.domain} = await ${n.domain}Repository.create({ name: 'Announcement', description: null })
	 */
	async create(input: Create${n.Entity}Input): Promise<${n.Entity}> {
		return await ${n.Entity}.create(input, this.client());
	}

	/**
	 * Deletes a ${n.domain} by its primary key.
	 *
	 * @param id - The ${n.domain} id to delete.
	 * @returns \`true\` when the record was found and deleted, \`false\` otherwise.
	 *
	 * @example
	 * const deleted = await ${n.domain}Repository.deleteById(1)
	 */
	async deleteById(id: number): Promise<boolean> {
		const ${n.domain} = await this.findById(id);

		if (!${n.domain}) return false;

		await ${n.domain}.delete();
		return true;
	}
}
`;

const queryFile = (
	n: DomainNames,
): string => `import { BaseQuery, type PaginatedResult } from '#core/queries/base_query';
import ${n.Entity} from '${n.domainAlias}/models/${n.domain}';
import type { ${n.Entity} as ${n.Entity}Domain } from '${n.domainAlias}/domain/${n.domain}';
import type { ${n.Entity}ListFilters } from '${n.domainAlias}/types/${n.domain}';

/**
 * Read-side query for listing persisted ${n.entities}, newest first.
 */
export class List${n.Entities}Query extends BaseQuery {
	/**
	 * Execute the ${n.entities} listing query.
	 *
	 * @param filters - Optional search filter plus pagination parameters.
	 * @returns A paginated result set of {@link ${n.Entity}Domain} records, newest first.
	 *
	 * @example
	 * const result = await list${n.Entities}Query.execute({ search: 'news', page: 1 })
	 */
	async execute(filters: ${n.Entity}ListFilters = {}): Promise<PaginatedResult<${n.Entity}Domain>> {
		const query = ${n.Entity}.query(this.client()).orderBy('created_at', 'desc');

		if (filters.search) {
			query.whereILike('name', \`%\${filters.search}%\`);
		}

		const result = await query.paginate(filters.page ?? 1, filters.perPage ?? 20);

		return this.toPaginated(result, (row) => row.toDomain());
	}
}
`;

const listActionFile = (n: DomainNames): string => `import { inject } from '@adonisjs/core';
import { List${n.Entities}Query } from '${n.domainAlias}/queries/list_${n.entities}_query';
import type { ${n.Entity}ListFilters } from '${n.domainAlias}/types/${n.domain}';

/**
 * List ${n.entities} for the admin ${n.entities} listing, with optional filters.
 */
@inject()
export class List${n.Entities}Action {
	constructor(protected list${n.Entities}Query: List${n.Entities}Query) {}

	/**
	 * Execute the ${n.entities} listing.
	 *
	 * @param filters - Optional search filter plus pagination parameters.
	 * @returns A paginated result set of ${n.entities}, newest first.
	 *
	 * @example
	 * const result = await list${n.Entities}Action.execute({ search: 'news', page: 1 })
	 */
	async execute(filters: ${n.Entity}ListFilters = {}) {
		return this.list${n.Entities}Query.execute(filters);
	}
}
`;

const createActionFile = (n: DomainNames): string => `import { inject } from '@adonisjs/core';
import { ${n.Entity}Service } from '${n.domainAlias}/services/${n.domain}_service';
import type { ${n.Entity} as ${n.Entity}Domain } from '${n.domainAlias}/domain/${n.domain}';

interface Create${n.Entity}Payload {
	name: string;
	description: string | null;
}

/**
 * Create a ${n.domain} through the ${n.domain} domain service.
 */
@inject()
export class Create${n.Entity}Action {
	constructor(protected ${n.domain}Service: ${n.Entity}Service) {}

	/**
	 * Execute ${n.domain} creation.
	 *
	 * @param payload - The ${n.domain} attributes.
	 * @returns The newly created {@link ${n.Entity}Domain}.
	 *
	 * @example
	 * const ${n.domain} = await create${n.Entity}Action.execute({ name: 'Announcement', description: null })
	 */
	async execute(payload: Create${n.Entity}Payload): Promise<${n.Entity}Domain> {
		const created = await this.${n.domain}Service.create({
			name: payload.name,
			description: payload.description,
		});

		return created.toDomain();
	}
}
`;

const deleteActionFile = (n: DomainNames): string => `import { inject } from '@adonisjs/core';
import { ${n.Entity}Service } from '${n.domainAlias}/services/${n.domain}_service';

interface Delete${n.Entity}Payload {
	id: number;
}

/**
 * Delete a ${n.domain} through the ${n.domain} domain service.
 */
@inject()
export class Delete${n.Entity}Action {
	constructor(protected ${n.domain}Service: ${n.Entity}Service) {}

	/**
	 * Execute ${n.domain} deletion.
	 *
	 * @param payload - The ${n.domain} id to delete.
	 * @returns \`true\` when the ${n.domain} was deleted.
	 *
	 * @example
	 * await delete${n.Entity}Action.execute({ id: 3 })
	 */
	async execute(payload: Delete${n.Entity}Payload): Promise<boolean> {
		return this.${n.domain}Service.delete(payload.id);
	}
}
`;

const serviceFile = (n: DomainNames): string => `import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import { withTransaction } from '#core/services/with_transaction';
import { LogService } from '#log/services/log_service';
import ${n.Entity} from '${n.domainAlias}/models/${n.domain}';
import { ${n.Entity}Repository } from '${n.domainAlias}/repositories/${n.domain}_repository';
import type { Create${n.Entity}Input } from '${n.domainAlias}/types/${n.domain}';

/**
 * Business service of the ${n.domain} domain, owning the creation and deletion
 * of ${n.entities}. Read operations live in the {@link List${n.Entities}Query}.
 */
@inject()
export class ${n.Entity}Service {
	constructor(
		protected ${n.domain}Repository: ${n.Entity}Repository,
		protected logService: LogService,
	) {}

	/**
	 * Create a ${n.domain} and record the business event.
	 *
	 * @param input - The ${n.domain} attributes.
	 * @returns The newly created {@link ${n.Entity}}.
	 *
	 * @example
	 * const ${n.domain} = await ${n.domain}Service.create({ name: 'Announcement', description: null })
	 */
	async create(input: Create${n.Entity}Input): Promise<${n.Entity}> {
		return withTransaction(async () => {
			const ${n.domain} = await this.${n.domain}Repository.create(input);

			this.logService.logBusiness('${n.domain}.created', { ${n.domain}Id: ${n.domain}.id });

			return ${n.domain};
		});
	}

	/**
	 * Delete a ${n.domain} and record the business event.
	 *
	 * @param id - The ${n.domain} id to delete.
	 * @returns \`true\` when the ${n.domain} was deleted.
	 * @throws {RowNotFoundException} When no ${n.domain} exists for the id.
	 *
	 * @example
	 * const deleted = await ${n.domain}Service.delete(3)
	 */
	async delete(id: number): Promise<boolean> {
		return withTransaction(async () => {
			const ${n.domain} = await this.${n.domain}Repository.findById(id);

			if (!${n.domain}) {
				throw new RowNotFoundException(${n.Entity});
			}

			const deleted = await this.${n.domain}Repository.deleteById(id);

			this.logService.logBusiness('${n.domain}.deleted', { ${n.domain}Id: id });

			return deleted;
		});
	}
}
`;

const domainRoutesFile = (n: DomainNames): string => `/*
|--------------------------------------------------------------------------
| ${n.Entity} routes
|--------------------------------------------------------------------------
|
| ${n.Entity} domain surface entry — mirrors \`start/routes.ts\`: each surface
| self-registers on import, co-located with the controllers it binds, and
| gates itself on its feature flag. The admin Inertia surface (session
| guard) and the versioned REST API (access-token guard) live under
| \`controllers/\`. Public URLs are \`/admin/${n.entities}\` and
| \`/api/v1/admin/${n.entities}\`.
|
*/

import '#transport/${n.domain}/controllers/admin/routes';
import '#transport/${n.domain}/controllers/api/routes';
`;

const adminControllerFile = (n: DomainNames): string => `import { inject } from '@adonisjs/core';
import { Delete${n.Entity}Action } from '${n.domainAlias}/actions/${n.domain}/delete_${n.domain}_action';
import { List${n.Entities}Action } from '${n.domainAlias}/actions/${n.domain}/list_${n.entities}_action';
import { extractPagination } from '#transport/core/helpers/extract_pagination';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import { stripEmptyStrings } from '#transport/core/helpers/strip_empty_strings';
import { build${n.Entities}ListPayload } from '#transport/${n.domain}/helpers/i18n_payloads/${n.entities}_list';
import ${n.Entity}Transformer from '#transport/${n.domain}/transformers/${n.domain}_transformer';
import { delete${n.Entity}Validator, list${n.Entities}Validator } from '#transport/${n.domain}/validators/${n.domain}';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * ${n.Entity} controller for the admin UI.
 * Renders the paginated, searchable ${n.entities} listing.
 */
@inject()
export default class ${n.Entities}Controller {
	constructor(
		protected i18n: I18nService,
		protected list${n.Entities}Action: List${n.Entities}Action,
		protected delete${n.Entity}Action: Delete${n.Entity}Action,
	) {}

	/**
	 * Render the ${n.entities} list page (Inertia).
	 */
	async render(ctx: HttpContext) {
		const { inertia, request } = ctx;

		const pagination = await extractPagination(request);
		const data = stripEmptyStrings(request.all());
		const payload = await list${n.Entities}Validator.validate(data);

		const ${n.entities} = await this.list${n.Entities}Action.execute({
			...payload,
			...pagination,
		});

		return renderInertiaPage(inertia, '${n.domain}/admin/index', {
			${n.entities}: ${n.Entity}Transformer.paginate(${n.entities}.all(), ${n.entities}.getMeta()),
			filters: payload,
			translations: build${n.Entities}ListPayload(this.i18n),
		});
	}

	/**
	 * Deletes a ${n.domain}.
	 */
	async destroy(ctx: HttpContext) {
		const { response, params, session } = ctx;

		const payload = await delete${n.Entity}Validator.validate(params);

		await this.delete${n.Entity}Action.execute({ id: payload.id });

		session.flash('success', this.i18n.translate('${n.domain}.admin.flash.deleted'));

		return response.redirect().toRoute('admin.${n.domain}.${n.entities}.render');
	}
}
`;

const adminRoutesFile = (n: DomainNames): string => `/*
|--------------------------------------------------------------------------
| ${n.Entity} admin routes
|--------------------------------------------------------------------------
|
| Inertia admin surface (session guard) for the ${n.entities} listing.
| Self-registers on import (see \`app/${n.domain}/routes.ts\`), gated by the
| \`admin\` feature flag. Public URLs live under \`/admin/${n.entities}\`;
| route names carry the \`admin.${n.domain}\` prefix.
|
*/

import router from '@adonisjs/core/services/router';
import features from '#config/features';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';
import { permissions } from '#start/permissions';
import { maintenanceMiddleware } from '#transport/core/maintenance';

if (features.admin) {
	router
		.group(() => {
			// ${n.Entities}
			router
				.group(() => {
					router
						.get('/', [controllers.${n.domain}.admin.${n.Entities}, 'render'])
						.use([middleware.permission({ permissions: [permissions.${n.entities}.view] })]);

					router
						.group(() => {
							router
								.delete('/', [controllers.${n.domain}.admin.${n.Entities}, 'destroy'])
								.use([middleware.permission({ permissions: [permissions.${n.entities}.delete] })]);
						})
						.prefix(':id');
				})
				.prefix('${n.entities}');
		})
		.prefix('admin')
		.as('admin.${n.domain}')
		.use([...maintenanceMiddleware, middleware.auth({ guards: ['web'] })]);
}
`;

const apiRoutesFile = (n: DomainNames): string => `/*
|--------------------------------------------------------------------------
| ${n.Entity} API routes
|--------------------------------------------------------------------------
|
| Versioned REST API (access-token guard) for the ${n.entities} admin surface.
| Self-registers on import (see \`app/${n.domain}/routes.ts\`), gated by the
| \`adminApi\` feature flag. Public URLs live under
| \`/api/v1/admin/${n.entities}\`; route names carry the
| \`api.v1.admin.${n.domain}\` prefix.
|
*/

import router from '@adonisjs/core/services/router';
import { enabledAuthGuards } from '#config/auth';
import features from '#config/features';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';
import { permissions } from '#start/permissions';
import { maintenanceMiddleware } from '#transport/core/maintenance';

/**
 * The admin JSON surface is shared: the in-repo admin UI (session guard) and
 * external API clients (access-token guard) consume the same endpoints.
 * Guards that are disabled in \`config/auth.ts\` must never reach
 * \`authenticateUsing\`, hence the conditional list.
 */
const apiGuards = enabledAuthGuards.api ? (['web', 'api'] as const) : (['web'] as const);

if (features.adminApi) {
	router
		.group(() => {
			router
				.group(() => {
					// ${n.Entities}
					router
						.group(() => {
							router
								.get('/', [controllers.${n.domain}.api.${n.Entities}Api, 'index'])
								.as('${n.domain}.${n.entities}.index')
								.use([middleware.permission({ permissions: [permissions.${n.entities}.view] })]);
							router
								.post('/', [controllers.${n.domain}.api.${n.Entities}CreateApi, 'store'])
								.as('${n.domain}.${n.entities}.store')
								.use([middleware.permission({ permissions: [permissions.${n.entities}.create] })]);
							router
								.delete('/:id', [controllers.${n.domain}.api.${n.Entities}DeleteApi, 'destroy'])
								.as('${n.domain}.${n.entities}.destroy')
								.use([middleware.permission({ permissions: [permissions.${n.entities}.delete] })]);
						})
						.prefix('${n.entities}');
				})
				.prefix('admin')
				.as('admin')
				.use([...maintenanceMiddleware, middleware.auth({ guards: [...apiGuards] })]);
		})
		.prefix('api/v1')
		.as('api.v1');
}
`;

const apiControllerFile = (n: DomainNames, method: 'index' | 'store' | 'destroy', action: string): string => {
	const className = `${n.Entities}${method === 'index' ? '' : method[0].toUpperCase() + method.slice(1)}ApiController`;
	const label = `${n.Entity} ${method}`;

	return `import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { handle } from '#transport/core/rest/rest_adapter';
import ${n.Entities}Resource from '#transport/${n.domain}/rest/${n.entities}_resource';

/**
 * ${action} — ${label} from the admin REST API.
 *
 * Thin transport adapter over the \`${method}\` endpoint of the
 * {@link ${n.Entities}Resource}; the endpoint declaration is executed by the
 * shared REST pipeline.
 */
@inject()
export default class ${className} {
	constructor(protected ${n.entities}Resource: ${n.Entities}Resource) {}

	async ${method}(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.${n.entities}Resource.endpoints.${method});
	}
}
`;
};

const resourceFile = (n: DomainNames): string => `import { inject } from '@adonisjs/core';
import { Create${n.Entity}Action } from '${n.domainAlias}/actions/${n.domain}/create_${n.domain}_action';
import { Delete${n.Entity}Action } from '${n.domainAlias}/actions/${n.domain}/delete_${n.domain}_action';
import { List${n.Entities}Action } from '${n.domainAlias}/actions/${n.domain}/list_${n.entities}_action';
import { type RestEndpoint } from '#transport/core/rest/rest_adapter';
import ${n.Entity}Transformer from '#transport/${n.domain}/transformers/${n.domain}_transformer';
import {
	create${n.Entity}Validator,
	list${n.Entities}Validator,
	rest${n.Entity}IdValidator,
} from '#transport/${n.domain}/validators/${n.domain}';
import type { Infer } from '@vinejs/vine/types';

type ${n.Entity}ListResult = Awaited<ReturnType<List${n.Entities}Action['execute']>>;
type ${n.Entity}CreateResult = Awaited<ReturnType<Create${n.Entity}Action['execute']>>;
type ${n.Entity}DeleteResult = Awaited<ReturnType<Delete${n.Entity}Action['execute']>>;

type ${n.Entity}ListPayload = Infer<typeof list${n.Entities}Validator>;
type ${n.Entity}CreatePayload = Infer<typeof create${n.Entity}Validator>;

/**
 * Endpoint declarations for the ${n.entities} REST resource.
 */
export interface ${n.Entities}Endpoints {
	index: RestEndpoint<undefined, ${n.Entity}ListPayload, ${n.Entity}ListResult, ${n.Entity}ListResult>;
	store: RestEndpoint<undefined, ${n.Entity}CreatePayload, ${n.Entity}CreateResult, ${n.Entity}CreateResult>;
	destroy: RestEndpoint<undefined, Infer<typeof rest${n.Entity}IdValidator>, ${n.Entity}DeleteResult, ${n.Entity}DeleteResult>;
}

/**
 * Declarative ${n.entities} REST resource.
 *
 * Owns the ${n.entities} REST endpoint declarations consumed by the REST
 * \`handle\` adapter (\`#transport/core/rest/rest_adapter\`); the
 * \`/api/v1/admin/${n.entities}\` controllers reduce to one-line dispatch over
 * \`endpoints\`.
 */
@inject()
export default class ${n.Entities}Resource {
	constructor(
		protected list${n.Entities}Action: List${n.Entities}Action,
		protected create${n.Entity}Action: Create${n.Entity}Action,
		protected delete${n.Entity}Action: Delete${n.Entity}Action,
	) {}

	readonly endpoints: ${n.Entities}Endpoints = {
		index: {
			paginated: true,
			strip: true,
			validator: () => list${n.Entities}Validator,
			execute: (context, _prepared, payload) =>
				this.list${n.Entities}Action.execute({ ...payload, ...context.pagination! }),
			transform: (entity) => ${n.Entity}Transformer.paginate(entity.all(), entity.getMeta()),
		},
		store: {
			status: 201,
			validator: () => create${n.Entity}Validator,
			execute: (_context, _prepared, payload) =>
				this.create${n.Entity}Action.execute({
					name: payload.name,
					description: payload.description ?? null,
				}),
			transform: (entity) => ${n.Entity}Transformer.transform(entity),
		},
		destroy: {
			status: 204,
			input: (context) => context.params,
			validator: () => rest${n.Entity}IdValidator,
			execute: (_context, _prepared, payload) => this.delete${n.Entity}Action.execute({ id: payload.id }),
		},
	};
}
`;

const transformerFile = (n: DomainNames): string => `import { BaseTransformer } from '@adonisjs/core/transformers';
import type { ${n.Entity} } from '${n.domainAlias}/domain/${n.domain}';

/**
 * Maps a {@link ${n.Entity}} domain object to the API/Inertia ${n.domain}
 * payload.
 */
export default class ${n.Entity}Transformer extends BaseTransformer<${n.Entity}> {
	/**
	 * Build the ${n.domain} payload.
	 */
	toObject() {
		return {
			id: this.resource.id.value,
			name: this.resource.name,
			description: this.resource.description,
			createdAt: this.resource.createdAt,
			updatedAt: this.resource.updatedAt,
		};
	}
}
`;

const validatorsFile = (n: DomainNames): string => `import vine from '@vinejs/vine';

const id = () => vine.number().exists({ table: '${n.entities}', column: 'id' });
const name = () => vine.string().trim().minLength(2).maxLength(100);

/**
 * Validates list query params for the ${n.entities} admin listing.
 */
export const list${n.Entities}Validator = vine.create({
	search: vine.string().trim().maxLength(100).optional(),
});

/**
 * Validates payload for creating a ${n.domain}.
 */
export const create${n.Entity}Validator = vine.create({
	name: name(),
	description: vine.string().trim().maxLength(255).optional(),
});

/**
 * Validates route params for ${n.domain} deletion.
 */
export const delete${n.Entity}Validator = vine.create({
	id: id(),
});

export { restIdValidator as rest${n.Entity}IdValidator } from '#transport/core/validators/rest';
`;

const i18nPayloadFile = (
	n: DomainNames,
): string => `import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the admin ${n.entities} listing page.
 */
export const ${n.Entities.toUpperCase()}_MAPPING = {
	title: '${n.domain}.admin.list.title',
	value: '${n.domain}.admin.value',
	empty: '${n.domain}.admin.list.empty',
	search: {
		value: '${n.domain}.admin.search.value',
		placeholder: '${n.domain}.admin.search.placeholder',
		filter: '${n.domain}.admin.search.filter',
	},
	table: {
		name: '${n.domain}.admin.table.name',
		description: '${n.domain}.admin.table.description',
		created_at: '${n.domain}.admin.table.created_at',
		actions: '${n.domain}.admin.table.actions',
	},
	delete: {
		confirm: '${n.domain}.admin.delete.confirm',
	},
	flash: {
		deleted: '${n.domain}.admin.flash.deleted',
	},
};

/**
 * Shape of the resolved translation payload for the admin ${n.entities} listing page.
 */
export type Admin${n.Entities}IndexTranslations = BuildPayloadResult<typeof ${n.Entities.toUpperCase()}_MAPPING>;

/**
 * Builds the resolved translation payload for the admin ${n.entities} listing page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The ${n.entities} listing \`t\` object with every UI string resolved.
 */
export function build${n.Entities}ListPayload(i18n: I18nTranslator): Admin${n.Entities}IndexTranslations {
	return i18n.buildPayload(${n.Entities.toUpperCase()}_MAPPING);
}
`;

const navFile = (n: DomainNames): string => `import { permissions } from '#start/permissions';
import type { AdminNavEntry } from '#core/types/nav';

/** Admin navigation entries contributed by the ${n.domain} domain. */
export const ${n.navEntriesName}: AdminNavEntry[] = [
	{
		label: '${n.domain}.admin.value',
		icon: 'Table',
		route: 'admin.${n.domain}.${n.entities}.render',
		permission: permissions.${n.entities}.view,
		category: 'settings',
	},
];
`;

const pageFile = (n: DomainNames): string => `import { Form } from '@adonisjs/inertia/react';
import { SharedProps } from '@adonisjs/inertia/types';
import { AdminMain } from '@foundry/design-system/admin-main';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Icon } from '@foundry/design-system/icon';
import { Pagination } from '@foundry/design-system/pagination';
import Table from '@foundry/design-system/table';
import { Data } from '@generated/data';
import { usePage } from '@inertiajs/react';
import { ReactElement } from 'react';
import { urlFor } from '~/client';
import { CanAccess } from '~/guards/can_access';
import { sanitizeText } from '~/helpers/sanitization';
import { useMenu } from '~/hooks/use_admin';
import { Lang, useTranslation } from '~/hooks/use_translation';
import Layout from '~/layouts/admin';
import { Paginated } from '~/types/paginated';
import type { Admin${n.Entities}IndexTranslations } from '#transport/${n.domain}/helpers/i18n_payloads/${n.entities}_list';

type PageProps = {
	${n.entities}: Paginated<Data.${n.Entity}.${n.Entity}>;
	filters: {
		search?: string;
	};
	translations: Admin${n.Entities}IndexTranslations;
};

export default function ${n.Entities}IndexPage(props: PageProps) {
	const { ${n.entities}, filters, translations } = props;
	const pageProps = usePage<SharedProps>().props;
	const { t, format } = useTranslation(translations);
	const { t: commonT } = useTranslation(pageProps.common_translations);

	const { getEntryIcon } = useMenu();

	return (
		<AdminMain title={t('title')} icon={getEntryIcon('admin.${n.domain}.${n.entities}.render')}>
			<Card
				header={
					<Form
						action={urlFor('admin.${n.domain}.${n.entities}.render')}
						method="get"
						className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
					>
						<Field
							type="text"
							name="search"
							label={t('search.value')}
							placeholder={t('search.placeholder')}
							defaultValue={filters.search}
							sanitizeValue={sanitizeText}
						/>
						<Button type="submit" fitContent>
							{t('search.filter')}
						</Button>
					</Form>
				}
				footer={
					<Pagination
						buildHref={(page) =>
							urlFor('admin.${n.domain}.${n.entities}.render', undefined, { qs: { ...filters, page } })
						}
						filters={filters}
						metadata={${n.entities}.metadata}
						summaryText={(start, end, total) => commonT('pagination.showing', { start, end, total })}
						previousTitle={commonT('pagination.previous')}
						nextTitle={commonT('pagination.next')}
					/>
				}
			>
				<Table>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>{t('table.name')}</Table.HeaderCell>
							<Table.HeaderCell>{t('table.description')}</Table.HeaderCell>
							<Table.HeaderCell>{t('table.created_at')}</Table.HeaderCell>
							<Table.HeaderCell>{t('table.actions')}</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{${n.entities}.data.length === 0 ? (
							<Table.Row>
								<Table.Cell colSpan={4} className="text-center! p-12!">
									{t('empty')}
								</Table.Cell>
							</Table.Row>
						) : (
							${n.entities}.data.map((${n.domain}: Data.${n.Entity}.${n.Entity}) => (
								<Table.Row key={\`${n.domain}-\${${n.domain}.id}\`}>
									<Table.Cell data-label={t('table.name')}>{${n.domain}.name}</Table.Cell>
									<Table.Cell data-label={t('table.description')}>{${n.domain}.description ?? '—'}</Table.Cell>
									<Table.Cell data-label={t('table.created_at')}>
										{${n.domain}.createdAt
											? format(new Date(${n.domain}.createdAt), 'medium', pageProps.locale as Lang)
											: '—'}
									</Table.Cell>
									<Table.Cell data-label={t('table.actions')}>
										<div className="flex items-center w-full py-4 gap-2">
											<CanAccess permission="${n.entities}.delete">
												<Form
													action={urlFor('admin.${n.domain}.${n.entities}.destroy', { id: ${n.domain}.id })}
													method="delete"
													onBefore={() => window.confirm(t('delete.confirm'))}
												>
													<Button variant="icon_danger" title={t('delete.confirm')} fitContent>
														<Icon name="Trash" size={18} />
													</Button>
												</Form>
											</CanAccess>
										</div>
									</Table.Cell>
								</Table.Row>
							))
						)}
					</Table.Body>
				</Table>
			</Card>
		</AdminMain>
	);
}

${n.Entities}IndexPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>;
`;

const enLangFile = (n: DomainNames): string => `{
	"admin": {
		"value": "${n.Entities}",
		"list": {
			"title": "${n.Entities}",
			"empty": "No ${n.entities} found."
		},
		"search": {
			"value": "Search",
			"placeholder": "Search ${n.entities}…",
			"filter": "Filter"
		},
		"table": {
			"name": "Name",
			"description": "Description",
			"created_at": "Created at",
			"actions": "Actions"
		},
		"delete": {
			"confirm": "Delete this ${n.domain}? This action cannot be undone."
		},
		"flash": {
			"deleted": "${n.Entity} deleted."
		}
	}
}
`;

const frLangFile = (n: DomainNames): string => `{
	"admin": {
		"value": "${n.Entities}",
		"list": {
			"title": "${n.Entities}",
			"empty": "Aucun ${n.domain} trouvé."
		},
		"search": {
			"value": "Rechercher",
			"placeholder": "Rechercher des ${n.entities}…",
			"filter": "Filtrer"
		},
		"table": {
			"name": "Nom",
			"description": "Description",
			"created_at": "Créé le",
			"actions": "Actions"
		},
		"delete": {
			"confirm": "Supprimer ce ${n.domain} ? Cette action est irréversible."
		},
		"flash": {
			"deleted": "${n.Entity} supprimé."
		}
	}
}
`;

const migrationFile = (n: DomainNames): string => `import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
	protected tableName = '${n.entities}';

	async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments('id');
			table.string('name', 100).notNullable();
			table.text('description').nullable();
			table.timestamp('created_at');
			table.timestamp('updated_at');
		});
	}

	async down() {
		this.schema.dropTable(this.tableName);
	}
}
`;

const factoryFile = (n: DomainNames): string => `import factory from '@adonisjs/lucid/factories';
import ${n.Entity} from '${n.domainAlias}/models/${n.domain}';

export const ${n.Entity}Factory = factory
	.define(${n.Entity}, async ({ faker }) => {
		return {
			name: faker.word.noun(),
			description: faker.lorem.sentence(),
		};
	})
	.build();
`;

const unitTestFile = (n: DomainNames): string => `import { test } from '@japa/runner';
import { ${n.Entity}Identifier } from '${n.domainAlias}/domain/identifiers';
import { ${n.Entity} } from '${n.domainAlias}/domain/${n.domain}';

const model = (overrides: Partial<{ id: number; name: string; description: string | null }> = {}) => ({
	id: overrides.id ?? 1,
	name: overrides.name ?? 'Announcement',
	description: overrides.description ?? null,
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

/**
 * Unit tests for the {@link ${n.Entity}} domain object.
 */
test.group('${n.Entity}', () => {
	test('fromModel() hydrates the identity through a ${n.Entity}Identifier', ({ assert }) => {
		const ${n.domain} = ${n.Entity}.fromModel(model({ id: 11 }));

		assert.isTrue(${n.domain}.id instanceof ${n.Entity}Identifier);
		assert.equal(${n.domain}.id.value, 11);
	});

	test('fromModel() defaults missing timestamps to null', ({ assert }) => {
		const ${n.domain} = ${n.Entity}.fromModel({
			id: 1,
			name: 'Announcement',
			description: 'A banner',
		});

		assert.isNull(${n.domain}.createdAt);
		assert.isNull(${n.domain}.updatedAt);
	});

	test('equals() compares identities', ({ assert }) => {
		const a = ${n.Entity}.fromModel(model({ id: 1 }));
		const b = ${n.Entity}.fromModel(model({ id: 1, name: 'Other' }));
		const c = ${n.Entity}.fromModel(model({ id: 2 }));

		assert.isTrue(a.equals(b));
		assert.isFalse(a.equals(c));
	});
});
`;

const functionalTestFile = (n: DomainNames): string => `import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';
import { ${n.Entity}Factory } from '#factories/${n.domain}/${n.domain}_factory';
import { createAdminUser } from '#tests/helpers/create_admin_user';
import { parseInertiaPage } from '#tests/helpers/inertia_page';

/** Every \`name\` rendered on the ${n.entities} page. */
function renderedNames(page: { props?: { ${n.entities}?: { data?: Array<{ name?: string }> } } }) {
	return (page.props?.${n.entities}?.data ?? []).map((${n.domain}) => ${n.domain}.name);
}

/**
 * Functional seam for the admin ${n.entities} listing (\`GET /admin/${n.entities}\`). We
 * assert the HTTP contract + the Inertia props a client receives: the
 * \`${n.entities}.view\` permission gate (403 for an authorized admin without it),
 * the rendered persisted records, and the server-side search filtering.
 */
test.group('Admin ${n.entities} listing', (group) => {
	group.each.setup(() => testUtils.db().truncate());

	test('denies access to a user without the ${n.entities}.view permission', async ({ client, assert }) => {
		const user = await createAdminUser({ email: 'no-${n.entities}-perm@example.com' });

		const res = await client.get('/admin/${n.entities}').loginAs(user).accept('json').send();

		res.assertStatus(403);
		assert.equal(res.body().error.code, 'E_FORBIDDEN');
	});

	test('renders persisted ${n.entities} for an authorized user', async ({ client, assert }) => {
		const user = await createAdminUser({
			email: '${n.entities}-admin@example.com',
			permissionSlugs: ['${n.entities}.view'],
		});
		const marker = \`functional_render_\${Date.now()}\`;
		await ${n.Entity}Factory.merge({ name: marker }).create();

		const res = await client.get('/admin/${n.entities}').loginAs(user).send();
		res.assertStatus(200);

		assert.include(renderedNames(parseInertiaPage(res.text())), marker);
	});

	test('filters rendered ${n.entities} by search term', async ({ client, assert }) => {
		const user = await createAdminUser({
			email: '${n.entities}-search@example.com',
			permissionSlugs: ['${n.entities}.view'],
		});
		const needle = \`functional_search_\${Date.now()}\`;
		await ${n.Entity}Factory.merge({ name: \`\${needle} needle\` }).create();
		await ${n.Entity}Factory.merge({ name: 'unrelated haystack entry' }).create();

		const res = await client.get(\`/admin/${n.entities}?search=\${needle}\`).loginAs(user).send();
		const names = renderedNames(parseInertiaPage(res.text()));

		assert.include(names, \`\${needle} needle\`);
		assert.notInclude(names, 'unrelated haystack entry');
	});
});
`;

/**
 * Render the full set of files that make up a new domain.
 *
 * @param names - The derived {@link DomainNames}.
 * @param options - Optional timestamp used to prefix the migration filename
 *   (defaults to `Date.now()`).
 * @returns The file descriptors, each relative to the app root.
 */
export function buildDomainFiles(names: DomainNames, options: { timestamp?: number } = {}): DomainFile[] {
	const timestamp = options.timestamp ?? Date.now();

	return [
		{ path: `src/${names.domain}/types/${names.domain}.ts`, content: typesFile(names) },
		{ path: `src/${names.domain}/domain/identifiers.ts`, content: identifiersFile(names) },
		{ path: `src/${names.domain}/domain/${names.domain}.ts`, content: domainFile(names) },
		{ path: `src/${names.domain}/models/${names.domain}.ts`, content: modelFile(names) },
		{ path: `src/${names.domain}/permissions.ts`, content: permissionsFile(names) },
		{ path: `src/${names.domain}/services/${names.domain}_service.ts`, content: serviceFile(names) },
		{ path: `src/${names.domain}/repositories/${names.domain}_repository.ts`, content: repositoryFile(names) },
		{ path: `src/${names.domain}/queries/list_${names.entities}_query.ts`, content: queryFile(names) },
		{
			path: `src/${names.domain}/actions/${names.domain}/list_${names.entities}_action.ts`,
			content: listActionFile(names),
		},
		{
			path: `src/${names.domain}/actions/${names.domain}/create_${names.domain}_action.ts`,
			content: createActionFile(names),
		},
		{
			path: `src/${names.domain}/actions/${names.domain}/delete_${names.domain}_action.ts`,
			content: deleteActionFile(names),
		},
		{ path: `app/${names.domain}/routes.ts`, content: domainRoutesFile(names) },
		{
			path: `app/${names.domain}/controllers/admin/${names.entities}_controller.ts`,
			content: adminControllerFile(names),
		},
		{ path: `app/${names.domain}/controllers/admin/routes.ts`, content: adminRoutesFile(names) },
		{
			path: `app/${names.domain}/controllers/api/${names.entities}_api_controller.ts`,
			content: apiControllerFile(
				names,
				'index',
				`GET /api/v1/admin/${names.entities} — paginated, searchable ${names.entities} listing.`,
			),
		},
		{
			path: `app/${names.domain}/controllers/api/${names.entities}_create_api_controller.ts`,
			content: apiControllerFile(
				names,
				'store',
				`POST /api/v1/admin/${names.entities} — create a ${names.domain} from the admin REST API.`,
			),
		},
		{
			path: `app/${names.domain}/controllers/api/${names.entities}_delete_api_controller.ts`,
			content: apiControllerFile(
				names,
				'destroy',
				`DELETE /api/v1/admin/${names.entities}/:id — delete a ${names.domain} from the admin REST API.`,
			),
		},
		{ path: `app/${names.domain}/controllers/api/routes.ts`, content: apiRoutesFile(names) },
		{ path: `app/${names.domain}/rest/${names.entities}_resource.ts`, content: resourceFile(names) },
		{ path: `app/${names.domain}/transformers/${names.domain}_transformer.ts`, content: transformerFile(names) },
		{ path: `app/${names.domain}/validators/${names.domain}.ts`, content: validatorsFile(names) },
		{ path: `app/${names.domain}/helpers/i18n_payloads/${names.entities}_list.ts`, content: i18nPayloadFile(names) },
		{ path: `app/${names.domain}/nav.ts`, content: navFile(names) },
		{ path: `inertia/pages/${names.domain}/admin/index.tsx`, content: pageFile(names) },
		{ path: `resources/lang/en/${names.domain}.json`, content: enLangFile(names) },
		{ path: `resources/lang/fr/${names.domain}.json`, content: frLangFile(names) },
		{ path: `database/migrations/${timestamp}_create_${names.entities}_table.ts`, content: migrationFile(names) },
		{ path: `database/factories/${names.domain}/${names.domain}_factory.ts`, content: factoryFile(names) },
		{ path: `tests/unit/${names.domain}/domain/${names.domain}.spec.ts`, content: unitTestFile(names) },
		{ path: `tests/functional/${names.domain}/admin_${names.entities}.spec.ts`, content: functionalTestFile(names) },
	];
}

/**
 * Add the domain route-module import to `start/routes.ts` (idempotent).
 *
 * @param content - The current `start/routes.ts` content.
 * @param names - The derived {@link DomainNames}.
 * @returns The updated content, unchanged when already registered.
 */
export function applyRoutesRegistration(content: string, names: DomainNames): string {
	const line = `import '#transport/${names.domain}/routes';`;
	const marker = `import '#transport/log/routes';`;

	if (content.includes(line)) return content;

	return content.includes(marker) ? content.replace(marker, `${marker}\n${line}`) : `${content.trimEnd()}\n${line}\n`;
}

/**
 * Add the domain permission catalog to `start/permissions.ts` (idempotent).
 *
 * @param content - The current `start/permissions.ts` content.
 * @param names - The derived {@link DomainNames}.
 * @returns The updated content, unchanged when already registered.
 */
export function applyPermissionsRegistration(content: string, names: DomainNames): string {
	const importLine = `import { ${names.permissionCatalogName} } from '${names.domainAlias}/permissions';`;
	const spreadLine = `\t...${names.permissionCatalogName},`;

	if (content.includes(importLine) || content.includes(spreadLine.trim())) return content;

	let next = content;

	if (!next.includes(importLine)) {
		next = next.replace(
			`import { loggingPermissionCatalog } from '#log/permissions';`,
			`import { loggingPermissionCatalog } from '#log/permissions';\n${importLine}`,
		);
	}

	if (!next.includes(spreadLine)) {
		next = next.replace(`\t...loggingPermissionCatalog,`, `\t...loggingPermissionCatalog,\n${spreadLine}`);
	}

	return next;
}

/**
 * Add the domain nav entries to `start/nav.ts` (idempotent).
 *
 * @param content - The current `start/nav.ts` content.
 * @param names - The derived {@link DomainNames}.
 * @returns The updated content, unchanged when already registered.
 */
export function applyNavRegistration(content: string, names: DomainNames): string {
	const importLine = `import { ${names.navEntriesName} } from '#transport/${names.domain}/nav';`;
	const registerLine = `registry.register('${names.domain}', ${names.navEntriesName});`;

	if (content.includes(importLine) || content.includes(registerLine)) return content;

	let next = content;

	if (!next.includes(importLine)) {
		next = next.replace(
			`import { loggingNavEntries } from '#transport/log/nav';`,
			`import { loggingNavEntries } from '#transport/log/nav';\n${importLine}`,
		);
	}

	if (!next.includes(registerLine)) {
		next = next.replace(
			`registry.register('logging', loggingNavEntries);`,
			`registry.register('logging', loggingNavEntries);\n${registerLine}`,
		);
	}

	return next;
}

/**
 * Add the `#<domain>/*` business import alias to the `package.json` imports
 * map (idempotent).
 *
 * @param content - The current `package.json` content.
 * @param names - The derived {@link DomainNames}.
 * @returns The updated content, unchanged when already registered.
 */
export function applyPackageImportsRegistration(content: string, names: DomainNames): string {
	const packageJson = JSON.parse(content) as { imports?: Record<string, string> };

	if (!packageJson.imports) return content;

	if (packageJson.imports[`#${names.domain}/*`]) return content;

	const imports: Record<string, string> = {};
	let inserted = false;

	for (const [key, value] of Object.entries(packageJson.imports)) {
		imports[key] = value;

		if (key === '#backup/*') {
			imports[`#${names.domain}/*`] = `./src/${names.domain}/*.js`;
			inserted = true;
		}
	}

	if (!inserted) {
		imports[`#${names.domain}/*`] = `./src/${names.domain}/*.js`;
	}

	packageJson.imports = imports;

	return `${JSON.stringify(packageJson, null, 2)}\n`;
}
