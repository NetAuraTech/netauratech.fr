import app from '@adonisjs/core/services/app';
import hash from '@adonisjs/core/services/hash';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { Token } from '#auth/domain/token';
import { TOKEN_TYPES, type FullToken, type TokenType } from '#auth/enums/token_type';
import InvalidTokenException from '#auth/exceptions/invalid_token_exception';
import MaxAttemptsExceededException from '#auth/exceptions/max_attempts_exceeded_exception';
import TokenModel from '#auth/models/token';
import { TokenRepository } from '#auth/repositories/token_repository';
import { TokenService } from '#auth/services/token_service';
import User from '#identity/models/user';

/**
 * Module-seam tests for the {@link TokenService}: the single home of the
 * Token lifecycle policy — issuance, verification with attempt accounting
 * and lockout, user resolution, and the exclusive row lock.
 */
test.group('TokenService', () => {
	const makeUser = async (prefix: string) => {
		const timestamp = Date.now() + Math.floor(Math.random() * 100000);
		return await User.create({
			email: `${prefix}_${timestamp}@example.com`,
			username: `${prefix}_${timestamp}`,
			password: 'password123',
		});
	};

	const createTestToken = async (
		userId: number,
		type: TokenType,
		options: { expiresInHours?: number; attempts?: number } = {},
	): Promise<{ plainToken: FullToken; selector: string }> => {
		const repo = await app.container.make(TokenRepository);
		const { selector, validator, token } = Token.generateSplit();

		await repo.create({
			userId,
			type,
			selector,
			token: await hash.make(validator),
			expiresAt: DateTime.now().plus({ hours: options.expiresInHours ?? 1 }),
			attempts: options.attempts ?? 0,
		});

		return { plainToken: token, selector };
	};

	const attemptsOf = async (selector: string) =>
		(await TokenModel.query().where('selector', selector).first())!.attempts;

	test('issue() persists a token of the given type and returns the full token', async ({ assert }) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('issue');

		const token = await service.issue(user, TOKEN_TYPES.PASSWORD_RESET, 1);

		assert.match(token, /^\S+\.\S+$/);

		const record = await TokenModel.query().where('type', TOKEN_TYPES.PASSWORD_RESET).where('user_id', user.id).first();
		assert.exists(record);
		assert.equal(record!.selector, token.split('.')[0]);
		assert.equal(record!.attempts, 0);
		assert.isAbove(record!.expiresAt!.toMillis(), Date.now());
	});

	test('issue() expires outstanding tokens of the same type only', async ({ assert }) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('issue_expire');
		const { plainToken: evToken } = await createTestToken(user.id, TOKEN_TYPES.EMAIL_VERIFICATION);
		const { plainToken: prToken } = await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET);

		await service.issue(user, TOKEN_TYPES.EMAIL_VERIFICATION, 24);

		const expired = await TokenModel.query().where('selector', evToken.split('.')[0]).first();
		assert.isAtMost(expired!.expiresAt!.toMillis(), Date.now());

		// A token of another type is untouched.
		const untouched = await TokenModel.query().where('selector', prToken.split('.')[0]).first();
		assert.isAbove(untouched!.expiresAt!.toMillis(), Date.now());
	});

	test('verify() resolves for a valid token', async ({ assert }) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('verify_ok');
		const { plainToken } = await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET);

		await assert.doesNotReject(() => service.verify(plainToken, TOKEN_TYPES.PASSWORD_RESET));
	});

	test('verify() throws InvalidTokenException for malformed, unknown, wrong-type, bad-validator, and expired tokens', async ({
		assert,
	}) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('verify_bad');
		const { plainToken, selector } = await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET);
		const { plainToken: expiredToken } = await createTestToken(user.id, TOKEN_TYPES.EMAIL_VERIFICATION, {
			expiresInHours: -1,
		});

		await assert.rejects(
			() => service.verify('malformed_token' as FullToken, TOKEN_TYPES.PASSWORD_RESET),
			InvalidTokenException,
		);
		await assert.rejects(
			() => service.verify('unknownsel.validator' as FullToken, TOKEN_TYPES.PASSWORD_RESET),
			InvalidTokenException,
		);
		await assert.rejects(() => service.verify(plainToken, TOKEN_TYPES.EMAIL_VERIFICATION), InvalidTokenException);
		await assert.rejects(
			() => service.verify(`${selector}.wrongvalidator` as FullToken, TOKEN_TYPES.PASSWORD_RESET),
			InvalidTokenException,
		);
		await assert.rejects(() => service.verify(expiredToken, TOKEN_TYPES.EMAIL_VERIFICATION), InvalidTokenException);
	});

	test('verify() throws MaxAttemptsExceededException for a locked token without further increment', async ({
		assert,
	}) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('verify_locked');
		const { plainToken, selector } = await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET, {
			attempts: service.MAX_ATTEMPTS,
		});

		await assert.rejects(() => service.verify(plainToken, TOKEN_TYPES.PASSWORD_RESET), MaxAttemptsExceededException);
		assert.equal(await attemptsOf(selector), service.MAX_ATTEMPTS);
	});

	test('verify() consumes exactly one attempt per presentation', async ({ assert }) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('verify_count');
		const { plainToken, selector } = await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET);

		await service.verify(plainToken, TOKEN_TYPES.PASSWORD_RESET);
		assert.equal(await attemptsOf(selector), 1);

		// A failed verification consumes an attempt too.
		await assert.rejects(
			() => service.verify(`${selector}.wrongvalidator` as FullToken, TOKEN_TYPES.PASSWORD_RESET),
			InvalidTokenException,
		);
		assert.equal(await attemptsOf(selector), 2);

		// Unknown selector and malformed tokens consume nothing — no record to increment.
		await assert.rejects(
			() => service.verify('unknownsel.validator' as FullToken, TOKEN_TYPES.PASSWORD_RESET),
			InvalidTokenException,
		);
		await assert.rejects(
			() => service.verify('malformed_token' as FullToken, TOKEN_TYPES.PASSWORD_RESET),
			InvalidTokenException,
		);
		assert.equal(await attemptsOf(selector), 2);
	});

	test('verify() concurrent presentations: exactly MAX_ATTEMPTS pass the lockout check', async ({ assert }) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('verify_race');
		const { plainToken, selector } = await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET);

		// Of 10 concurrent presentations, exactly MAX_ATTEMPTS may pass the
		// cap check and increment — the rest must observe the lockout. An
		// unlocked check-then-act lets the concurrent readers all see the
		// stale counter, bypass the cap, and clobber each other's increment.
		const results = await Promise.allSettled(
			Array.from({ length: 10 }, () => service.verify(plainToken, TOKEN_TYPES.PASSWORD_RESET)),
		);

		const accepted = results.filter((r) => r.status === 'fulfilled');
		const rejected = results.filter((r) => r.status === 'rejected');

		assert.equal(accepted.length, service.MAX_ATTEMPTS);
		assert.equal(rejected.length, 10 - service.MAX_ATTEMPTS);

		for (const r of rejected) {
			assert.instanceOf((r as PromiseRejectedResult).reason, MaxAttemptsExceededException);
		}

		assert.equal(await attemptsOf(selector), service.MAX_ATTEMPTS);
	});

	test('resolveUser() returns the user for a valid token', async ({ assert }) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('resolve_ok');
		const { plainToken } = await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET);

		const resolved = await service.resolveUser(plainToken, TOKEN_TYPES.PASSWORD_RESET);

		assert.equal(resolved.id, user.id);
	});

	test('resolveUser() throws InvalidTokenException for an invalid token', async ({ assert }) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('resolve_bad');
		await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET);

		await assert.rejects(
			() => service.resolveUser('invalid.token' as FullToken, TOKEN_TYPES.PASSWORD_RESET),
			InvalidTokenException,
		);
	});

	test('resolveUser() propagates the lockout of a locked token', async ({ assert }) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('resolve_locked');
		const { plainToken } = await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET, {
			attempts: service.MAX_ATTEMPTS,
		});

		await assert.rejects(
			() => service.resolveUser(plainToken, TOKEN_TYPES.PASSWORD_RESET),
			MaxAttemptsExceededException,
		);
	});

	test("consume() runs act under the lock, expires the token of the type, and returns act's value", async ({
		assert,
	}) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('consume_ok');
		const { plainToken } = await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET);
		const { plainToken: otherTypeToken } = await createTestToken(user.id, TOKEN_TYPES.EMAIL_VERIFICATION);

		let actedFor: number | null = null;
		const result = await service.consume(plainToken, TOKEN_TYPES.PASSWORD_RESET, async (u) => {
			actedFor = u.id;
			return 'acted';
		});

		assert.equal(result, 'acted');
		assert.equal(actedFor, user.id);

		const record = await TokenModel.query().where('selector', plainToken.split('.')[0]).first();
		assert.isAtMost(record!.expiresAt!.toMillis(), Date.now());

		// A token of another type is untouched.
		const untouched = await TokenModel.query().where('selector', otherTypeToken.split('.')[0]).first();
		assert.isAbove(untouched!.expiresAt!.toMillis(), Date.now());
	});

	test('consume() concurrent double presentation: exactly one acts, the other is rejected', async ({ assert }) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('consume_race');
		const { plainToken } = await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET);

		let applications = 0;
		const act = async () => {
			applications += 1;
			return applications;
		};

		// Two presentations of the same token racing: the token row is locked
		// as the first query of the consuming transaction, so the second one
		// must observe the token consumed by the first and be rejected.
		const results = await Promise.allSettled([
			service.consume(plainToken, TOKEN_TYPES.PASSWORD_RESET, act),
			service.consume(plainToken, TOKEN_TYPES.PASSWORD_RESET, act),
		]);

		const statuses = results.map((r) => r.status).sort();
		assert.deepEqual(statuses, ['fulfilled', 'rejected']);

		const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
		assert.instanceOf(rejected.reason, InvalidTokenException);
		assert.equal(applications, 1);

		const record = await TokenModel.query().where('selector', plainToken.split('.')[0]).first();
		assert.isAtMost(record!.expiresAt!.toMillis(), Date.now());
	});

	test('consume() throws InvalidTokenException for expired, missing, or malformed tokens', async ({ assert }) => {
		const service = await app.container.make(TokenService);
		const user = await makeUser('consume_bad');
		const { plainToken } = await createTestToken(user.id, TOKEN_TYPES.PASSWORD_RESET, { expiresInHours: -1 });

		await assert.rejects(
			() => service.consume(plainToken, TOKEN_TYPES.PASSWORD_RESET, async () => 'never'),
			InvalidTokenException,
		);
		await assert.rejects(
			() => service.consume('nosuchsel.validator' as FullToken, TOKEN_TYPES.PASSWORD_RESET, async () => 'never'),
			InvalidTokenException,
		);
		await assert.rejects(
			() => service.consume('malformed_token' as FullToken, TOKEN_TYPES.PASSWORD_RESET, async () => 'never'),
			InvalidTokenException,
		);
	});

	test('MAX_ATTEMPTS is unified at 3', async ({ assert }) => {
		const service = await app.container.make(TokenService);
		assert.equal(service.MAX_ATTEMPTS, 3);
	});
});
