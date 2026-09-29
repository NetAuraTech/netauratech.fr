import { USER_STATUSES } from '#identity/domain/user';
import { registerApiDoc, type JsonSchema } from '#transport/core/openapi/api_docs_registry';
import {
	listRolesValidator,
	createRoleValidator,
	updateRoleValidator,
	restRoleIdValidator,
} from '#transport/identity/validators/role';
import { listValidator, createValidator, updateValidator, restIdValidator } from '#transport/identity/validators/user';

/** Nullable ISO-8601 timestamp as produced by the serializer. */
const dateTime: JsonSchema = { type: 'string', format: 'date-time', nullable: true };

/** The permission payload, as shaped by `PermissionTransformer`. */
const permissionSchema: JsonSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		name: { type: 'string' },
		slug: { type: 'string' },
		description: { type: 'string', nullable: true },
		category: { type: 'string', nullable: true },
		isSystem: { type: 'boolean' },
		createdAt: dateTime,
		updatedAt: dateTime,
	},
};

/**
 * The user payload as embedded in a role's `users` list. Deliberately omits
 * the nested `role` (which would make the schema self-referential and
 * unserializable): the enclosing resource is the role, so repeating it is
 * redundant.
 */
const userInRoleSchema: JsonSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		username: { type: 'string' },
		email: { type: 'string', format: 'email' },
		status: { type: 'string', enum: USER_STATUSES },
		emailVerifiedAt: dateTime,
		createdAt: dateTime,
		updatedAt: dateTime,
	},
};

/** The role payload, as shaped by `RoleTransformer`. */
const roleSchema: JsonSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		name: { type: 'string' },
		slug: { type: 'string' },
		description: { type: 'string', nullable: true },
		isSystem: { type: 'boolean' },
		createdAt: dateTime,
		updatedAt: dateTime,
		permissions: { type: 'array', items: permissionSchema, nullable: true },
		users: { type: 'array', items: userInRoleSchema, nullable: true },
		usersCount: { type: 'number', nullable: true },
	},
};

/** The user payload, as shaped by `UserTransformer`. */
const userSchema: JsonSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		username: { type: 'string' },
		email: { type: 'string', format: 'email' },
		status: { type: 'string', enum: USER_STATUSES },
		emailVerifiedAt: dateTime,
		createdAt: dateTime,
		updatedAt: dateTime,
		connectedProviders: {
			type: 'object',
			properties: {
				github: { type: 'boolean' },
				google: { type: 'boolean' },
				facebook: { type: 'boolean' },
			},
		},
		role: { ...roleSchema, nullable: true },
		permissions: { type: 'array', items: { type: 'string' } },
	},
};

/** The standard JSON error envelope, as shaped by the exception handler. */
const errorSchema: JsonSchema = {
	type: 'object',
	properties: {
		error: {
			type: 'object',
			properties: {
				code: { type: 'string' },
				message: { type: 'string' },
				details: { type: 'object' },
			},
		},
	},
};

/** The 422 validation error body, as shaped by Vine's default handler. */
const validationErrorSchema: JsonSchema = {
	type: 'object',
	properties: {
		errors: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					message: { type: 'string' },
					field: { type: 'string' },
				},
			},
		},
	},
};

/** The REST success envelope: the payload serialized under `data`. */
const dataEnvelope = (schema: JsonSchema): JsonSchema => ({
	type: 'object',
	properties: { data: schema },
});

/** The REST pagination envelope: items under `data`, page metadata under `metadata`. */
const paginatedEnvelope = (itemSchema: JsonSchema): JsonSchema => ({
	type: 'object',
	properties: {
		data: { type: 'array', items: itemSchema },
		metadata: {
			type: 'object',
			properties: {
				total: { type: 'number' },
				perPage: { type: 'number' },
				currentPage: { type: 'number' },
				lastPage: { type: 'number' },
			},
		},
	},
});

/**
 * Register the docs metadata of the identity REST surface
 * (users, roles, permissions) under their full route names.
 *
 * Called from `app/identity/controllers/api/routes.ts` at import time,
 * alongside the routes they document, so the docs and the routes live or
 * die together. Request schemas are derived from the very same validators
 * the endpoints execute (`listValidator`, `createValidator`, …), instantiated
 * here with placeholder arguments: the dynamic rules (`in`, `unique`,
 * `exists`) do not contribute to the JSON schema, so the argument values are
 * irrelevant to the documented shape.
 */
export function registerIdentityApiDocs(): void {
	// Users
	registerApiDoc('api.v1.admin.identity.users.index', {
		summary: 'List users',
		description: 'Paginated user listing, filterable by search term and role slug.',
		tags: ['Users'],
		request: [{ validator: listValidator([]), in: 'query' }],
		paginated: true,
		responses: {
			'200': { description: 'The paginated user list.', schema: paginatedEnvelope(userSchema) },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});
	registerApiDoc('api.v1.admin.identity.users.store', {
		summary: 'Create a user',
		tags: ['Users'],
		request: [{ validator: createValidator([]), in: 'body' }],
		responses: {
			'201': { description: 'The created user.', schema: dataEnvelope(userSchema) },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});
	registerApiDoc('api.v1.admin.identity.users.show', {
		summary: 'Show a user',
		tags: ['Users'],
		request: [{ validator: restIdValidator, in: 'path' }],
		responses: {
			'200': { description: 'The user.', schema: dataEnvelope(userSchema) },
			'404': { description: 'The user does not exist.', schema: errorSchema },
		},
	});
	registerApiDoc('api.v1.admin.identity.users.update', {
		summary: 'Update a user',
		tags: ['Users'],
		request: [
			{ validator: restIdValidator, in: 'path' },
			{ validator: updateValidator(0, []), in: 'body' },
		],
		responses: {
			'200': { description: 'The updated user.', schema: dataEnvelope(userSchema) },
			'404': { description: 'The user does not exist.', schema: errorSchema },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});
	registerApiDoc('api.v1.admin.identity.users.destroy', {
		summary: 'Delete a user',
		tags: ['Users'],
		request: [{ validator: restIdValidator, in: 'path' }],
		responses: {
			'204': { description: 'The user was deleted.' },
			'404': { description: 'The user does not exist.', schema: errorSchema },
		},
	});

	// Roles
	registerApiDoc('api.v1.admin.identity.roles.index', {
		summary: 'List roles',
		description: 'Paginated role listing, filterable by search term.',
		tags: ['Roles'],
		request: [{ validator: listRolesValidator, in: 'query' }],
		paginated: true,
		responses: {
			'200': { description: 'The paginated role list.', schema: paginatedEnvelope(roleSchema) },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});
	registerApiDoc('api.v1.admin.identity.roles.store', {
		summary: 'Create a role',
		tags: ['Roles'],
		request: [{ validator: createRoleValidator, in: 'body' }],
		responses: {
			'201': { description: 'The created role.', schema: dataEnvelope(roleSchema) },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});
	registerApiDoc('api.v1.admin.identity.roles.show', {
		summary: 'Show a role',
		tags: ['Roles'],
		request: [{ validator: restRoleIdValidator, in: 'path' }],
		responses: {
			'200': { description: 'The role.', schema: dataEnvelope(roleSchema) },
			'404': { description: 'The role does not exist.', schema: errorSchema },
		},
	});
	registerApiDoc('api.v1.admin.identity.roles.update', {
		summary: 'Update a role',
		tags: ['Roles'],
		request: [
			{ validator: restRoleIdValidator, in: 'path' },
			{ validator: updateRoleValidator(0), in: 'body' },
		],
		responses: {
			'200': { description: 'The updated role.', schema: dataEnvelope(roleSchema) },
			'404': { description: 'The role does not exist.', schema: errorSchema },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});
	registerApiDoc('api.v1.admin.identity.roles.destroy', {
		summary: 'Delete a role',
		tags: ['Roles'],
		request: [{ validator: restRoleIdValidator, in: 'path' }],
		responses: {
			'204': { description: 'The role was deleted.' },
			'404': { description: 'The role does not exist.', schema: errorSchema },
		},
	});

	// Permissions
	registerApiDoc('api.v1.admin.identity.permissions.index', {
		summary: 'List permissions',
		description: 'The full permission catalog (read-only).',
		tags: ['Permissions'],
		responses: {
			'200': { description: 'The permission list.', schema: dataEnvelope({ type: 'array', items: permissionSchema }) },
		},
	});
}
