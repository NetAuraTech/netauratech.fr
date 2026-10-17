import { test } from '@japa/runner';
import { User } from '#identity/domain/user';
import { pinDrift, pinEnvelope, serializePayload } from '#tests/helpers/openapi_drift';
import { userSchema as accountUserSchema } from '#transport/account/rest/account_resource';
import { userSchema as profileUserSchema } from '#transport/account/rest/profile_resource';
import { dataEnvelope } from '#transport/core/openapi/schemas';
import UserTransformer from '#transport/identity/transformers/user_transformer';

const now = new Date('2026-01-15T10:00:00.000Z');

function makeUser(): User {
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
		role: null,
		createdAt: now,
		updatedAt: now,
	});
}

test.group('OpenAPI drift — account & profile schemas', () => {
	test('account user payload is pinned to the account userSchema', async () => {
		const payload = await serializePayload(new UserTransformer(makeUser()).toObject());

		pinDrift(accountUserSchema, payload, 'account user');
	});

	test('profile user payload is pinned to the profile userSchema', async () => {
		const payload = await serializePayload(new UserTransformer(makeUser()).toObject());

		pinDrift(profileUserSchema, payload, 'profile user');
	});

	test('account and profile envelopes conform to the documented envelopes', async () => {
		const payload = await serializePayload(new UserTransformer(makeUser()).toObject());

		pinEnvelope(dataEnvelope(accountUserSchema), { data: payload }, 'account update envelope');
		pinEnvelope(dataEnvelope(profileUserSchema), { data: payload }, 'profile show envelope');
	});

	test('a dropped documented field is rejected against both copies', async ({ assert }) => {
		const payload = await serializePayload(new UserTransformer(makeUser()).toObject());
		delete payload.connectedProviders;

		assert.throws(
			() => pinDrift(accountUserSchema, payload, 'account user'),
			/missing from payload: \[connectedProviders\]/,
		);
		assert.throws(
			() => pinDrift(profileUserSchema, payload, 'profile user'),
			/missing from payload: \[connectedProviders\]/,
		);
	});
});
