import { test } from '@japa/runner';
import { Permission } from '#identity/domain/permission';
import { Role } from '#identity/domain/role';
import { User } from '#identity/domain/user';
import { lucidMeta, pinDrift, pinEnvelope, serializePayload } from '#tests/helpers/openapi_drift';
import { dataEnvelope, paginatedEnvelope } from '#transport/core/openapi/schemas';
import { permissionSchema, roleSchema, userSchema } from '#transport/identity/rest/users_resource';
import PermissionTransformer from '#transport/identity/transformers/permission_transformer';
import RoleTransformer from '#transport/identity/transformers/role_transformer';
import UserTransformer from '#transport/identity/transformers/user_transformer';

const now = new Date('2026-01-15T10:00:00.000Z');

function makePermission(): Permission {
	return Permission.fromModel({
		id: 1,
		slug: 'users.read',
		name: 'Read users',
		description: null,
		category: 'identity',
		isSystem: true,
		createdAt: now,
		updatedAt: now,
	});
}

function makeUser(role: Role | null = null): User {
	return User.fromModel({
		id: 1,
		username: 'alice',
		email: 'alice@example.com',
		apiRateLimit: 100,
		hasPendingInvite: false,
		isEmailVerified: true,
		emailVerifiedAt: now,
		githubId: null,
		googleId: 'google-123',
		facebookId: null,
		role,
		createdAt: now,
		updatedAt: now,
	});
}

/** A role with both relations preloaded and a selected aggregate, i.e. the full 10-key payload. */
function makeFullRole(): Role {
	return Role.fromModel({
		id: 1,
		slug: 'admin',
		name: 'Administrator',
		description: null,
		isSystem: true,
		permissions: [makePermission()],
		users: [makeUser(), makeUser()],
		usersCount: 2,
		createdAt: now,
		updatedAt: now,
	});
}

test.group('OpenAPI drift — identity schemas', () => {
	test('user payload is pinned to userSchema', async () => {
		const payload = await serializePayload(new UserTransformer(makeUser(makeFullRole())).toObject());

		pinDrift(userSchema, payload, 'user');
	});

	test('user show and list envelopes conform to the documented envelopes', async () => {
		const payload = await serializePayload(new UserTransformer(makeUser(makeFullRole())).toObject());

		pinEnvelope(dataEnvelope(userSchema), { data: payload }, 'user show envelope');
		pinEnvelope(paginatedEnvelope(userSchema), { data: [payload], metadata: lucidMeta() }, 'user list envelope');
	});

	test('fully preloaded role payload is pinned to roleSchema', async () => {
		const payload = await serializePayload(new RoleTransformer(makeFullRole()).toObject());

		pinDrift(roleSchema, payload, 'role');
	});

	test('permission payload is pinned to permissionSchema', async () => {
		const payload = await serializePayload(new PermissionTransformer(makePermission()).toObject());

		pinDrift(permissionSchema, payload, 'permission');
	});

	test('a dropped documented field is rejected', async ({ assert }) => {
		const payload = await serializePayload(new UserTransformer(makeUser(makeFullRole())).toObject());
		delete payload.apiRateLimit;

		assert.throws(() => pinDrift(userSchema, payload, 'user'), /missing from payload: \[apiRateLimit\]/);
	});

	test('a renamed documented field is rejected', async ({ assert }) => {
		const payload = await serializePayload(new UserTransformer(makeUser(makeFullRole())).toObject());
		payload.handle = payload.username;
		delete payload.username;

		assert.throws(() => pinDrift(userSchema, payload, 'user'), /missing from payload: \[username\]/);
	});

	test('an undocumented emitted field is rejected', async ({ assert }) => {
		const payload = await serializePayload(new UserTransformer(makeUser(makeFullRole())).toObject());
		payload.passwordHash = 'sha256:...';

		assert.throws(() => pinDrift(userSchema, payload, 'user'), /emitted but not documented: \[passwordHash\]/);
	});
});
