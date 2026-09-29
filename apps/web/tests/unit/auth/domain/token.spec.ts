import { test } from '@japa/runner';
import { TokenIdentifier } from '#auth/domain/identifiers';
import { Token } from '#auth/domain/token';
import { TOKEN_TYPES, type TokenType } from '#auth/enums/token_type';

const model = (
	overrides: Partial<{
		id: number;
		userId: number | null;
		type: TokenType;
		selector: string | null;
		expiresAt: Date | null;
		attempts: number;
	}> = {},
) => ({
	id: overrides.id ?? 1,
	userId: overrides.userId ?? 2,
	type: overrides.type ?? TOKEN_TYPES.PASSWORD_RESET,
	selector: overrides.selector ?? 'selector-value',
	expiresAt: overrides.expiresAt !== undefined ? overrides.expiresAt : new Date(Date.now() + 60_000),
	attempts: overrides.attempts ?? 0,
});

/**
 * Unit tests for the {@link Token} domain object — the token state and its
 * invariants, plus the shared selector/validator helpers.
 */
test.group('Token', () => {
	// ─── fromModel() ─────────────────────────────────────────────────────────

	test('fromModel() hydrates the identity through a TokenIdentifier', ({ assert }) => {
		const token = Token.fromModel(model({ id: 7 }));

		assert.isTrue(token.id instanceof TokenIdentifier);
		assert.equal(token.id.value, 7);
		assert.equal(token.userId, 2);
		assert.equal(token.type, 'PASSWORD_RESET');
		assert.equal(token.selector, 'selector-value');
		assert.equal(token.attempts, 0);
	});

	test('fromModel() carries a null expiration', ({ assert }) => {
		const token = Token.fromModel(model({ expiresAt: null }));

		assert.isNull(token.expiresAt);
	});

	// ─── isExpired() ─────────────────────────────────────────────────────────

	test('isExpired() is false while the token is within its validity window', ({ assert }) => {
		const token = Token.fromModel(model({ expiresAt: new Date(Date.now() + 60_000) }));

		assert.isFalse(token.isExpired());
	});

	test('isExpired() is true once the token is past its expiration', ({ assert }) => {
		const token = Token.fromModel(model({ expiresAt: new Date(Date.now() - 60_000) }));

		assert.isTrue(token.isExpired());
	});

	test('isExpired() honours an explicit reference time', ({ assert }) => {
		const expiresAt = new Date('2026-01-01T00:00:00Z');
		const token = Token.fromModel(model({ expiresAt }));

		assert.isFalse(token.isExpired(new Date('2025-12-31T00:00:00Z')));
		assert.isTrue(token.isExpired(new Date('2026-01-01T00:00:00Z')));
	});

	test('a token without an expiration stamp is invalid', ({ assert }) => {
		assert.isTrue(Token.fromModel(model({ expiresAt: null })).isExpired());
	});

	// ─── hasExceededAttempts() ───────────────────────────────────────────────

	test('hasExceededAttempts() is false below the maximum', ({ assert }) => {
		assert.isFalse(Token.fromModel(model({ attempts: 2 })).hasExceededAttempts(3));
	});

	test('hasExceededAttempts() is true at and above the maximum', ({ assert }) => {
		assert.isTrue(Token.fromModel(model({ attempts: 3 })).hasExceededAttempts(3));
		assert.isTrue(Token.fromModel(model({ attempts: 4 })).hasExceededAttempts(3));
	});

	// ─── equals() ────────────────────────────────────────────────────────────

	test('equals() compares identities, not fields', ({ assert }) => {
		const a = Token.fromModel(model({ id: 1 }));
		const b = Token.fromModel(model({ id: 1, attempts: 3 }));
		const c = Token.fromModel(model({ id: 2 }));

		assert.isTrue(a.equals(b));
		assert.isFalse(a.equals(c));
	});

	// ─── static helpers ──────────────────────────────────────────────────────

	test('generate() produces a hex string of the requested byte length', ({ assert }) => {
		assert.lengthOf(Token.generate(16), 32);
		assert.match(Token.generate(16), /^[0-9a-f]+$/);
	});

	test('generateSplit() produces selector, validator and the full token', ({ assert }) => {
		const { selector, validator, token } = Token.generateSplit(8, 8);

		assert.lengthOf(selector, 16);
		assert.lengthOf(validator, 16);
		assert.equal(token, `${selector}.${validator}`);
	});

	test('split() round-trips a generated token', ({ assert }) => {
		const { selector, validator, token } = Token.generateSplit(8, 8);

		assert.deepEqual(Token.split(token), { selector, validator });
	});

	test('split() returns null for malformed tokens', ({ assert }) => {
		assert.isNull(Token.split('no-dot-here' as any));
		assert.isNull(Token.split('.validator'));
		assert.isNull(Token.split('selector.' as any));
	});

	test('mask() keeps the first 8 and last 4 characters', ({ assert }) => {
		const token = '0123456789abcdef0123456789abcdef';

		const masked = Token.mask(token);
		assert.equal(masked.slice(0, 8), '01234567');
		assert.equal(masked.slice(-4), 'cdef');
		assert.isFalse(masked.includes('89abcdef0123'));
	});

	test('mask() leaves short tokens untouched', ({ assert }) => {
		assert.equal(Token.mask('short'), 'short');
	});
});
