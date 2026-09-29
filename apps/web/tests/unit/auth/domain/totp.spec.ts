import { test } from '@japa/runner';
import { Totp } from '#auth/domain/totp';

/**
 * Unit seam for the pure TOTP helpers. These are dependency-free (node:crypto
 * only), so they are exercised directly — no app container, DB, or mocking.
 */
test.group('Totp domain', () => {
	test('base32: encodes the RFC 4648 test vectors', ({ assert }) => {
		const vectors: [string, string][] = [
			['f', 'MY'],
			['fo', 'MZXQ'],
			['foo', 'MZXW6'],
			['foob', 'MZXW6YQ'],
			['fooba', 'MZXW6YTB'],
			['foobar', 'MZXW6YTBOI'],
		];

		for (const [input, expected] of vectors) {
			assert.equal(Totp.encodeBase32(Buffer.from(input, 'utf-8')), expected);
			assert.equal(Totp.decodeBase32(expected).toString('utf-8'), input);
		}
	});

	test('base32: decode tolerates padding and whitespace', ({ assert }) => {
		assert.equal(Totp.decodeBase32('MZXW6YTBOI==').toString('utf-8'), 'foobar');
		assert.equal(Totp.decodeBase32('mzxw6y tboi').toString('utf-8'), 'foobar');
	});

	test('generateSecret: returns a base32 string that decodes to the requested length', ({ assert }) => {
		const secret = Totp.generateSecret();

		assert.isString(secret);
		assert.match(secret, /^[A-Z2-7]+$/);
		assert.equal(Totp.decodeBase32(secret).length, 20);
	});

	test('generateSecret: produces distinct secrets', ({ assert }) => {
		assert.notEqual(Totp.generateSecret(), Totp.generateSecret());
	});

	test('code: returns a 6-digit numeric code', ({ assert }) => {
		const secret = Totp.generateSecret();
		assert.match(Totp.code(secret), /^\d{6}$/);
	});

	test('code: is deterministic for a fixed timestamp', ({ assert }) => {
		const secret = Totp.generateSecret();
		const t = 1_700_000_000_000;
		assert.equal(Totp.code(secret, { timestampMs: t }), Totp.code(secret, { timestampMs: t }));
	});

	test('verify: accepts the code for the current period', ({ assert }) => {
		const secret = Totp.generateSecret();
		const t = 1_700_000_000_000;
		const code = Totp.code(secret, { timestampMs: t });
		assert.isTrue(Totp.verify(secret, code, { timestampMs: t }));
	});

	test('verify: accepts a code from one period in the past (replay window)', ({ assert }) => {
		const secret = Totp.generateSecret();
		const t = 1_700_000_000_000;
		const previous = Totp.code(secret, { timestampMs: t - 30_000 });
		assert.isTrue(Totp.verify(secret, previous, { timestampMs: t }));
	});

	test('verify: rejects a code from two periods ago (outside the window)', ({ assert }) => {
		const secret = Totp.generateSecret();
		const t = 1_700_000_000_000;
		const stale = Totp.code(secret, { timestampMs: t - 60_000 });
		assert.isFalse(Totp.verify(secret, stale, { timestampMs: t }));
	});

	test('verify: rejects a wrong code', ({ assert }) => {
		const secret = Totp.generateSecret();
		const t = 1_700_000_000_000;
		const code = Totp.code(secret, { timestampMs: t });
		const wrong = String((Number(code) + 1) % 1_000_000).padStart(6, '0');
		assert.isFalse(Totp.verify(secret, wrong, { timestampMs: t }));
	});

	test('verify: rejects malformed codes (non-numeric / wrong length)', ({ assert }) => {
		const secret = Totp.generateSecret();
		const t = 1_700_000_000_000;
		assert.isFalse(Totp.verify(secret, 'abcdef', { timestampMs: t }));
		assert.isFalse(Totp.verify(secret, '123', { timestampMs: t }));
		assert.isFalse(Totp.verify(secret, '', { timestampMs: t }));
	});

	test('verify: rejects a blank secret', ({ assert }) => {
		const t = 1_700_000_000_000;
		assert.isFalse(Totp.verify('', '123456', { timestampMs: t }));
	});

	test('otpauthUri: embeds the label, secret and standard params', ({ assert }) => {
		const secret = Totp.generateSecret();
		const uri = Totp.otpauthUri(secret, 'john.doe@example.com', 'Foundry');

		assert.isTrue(uri.startsWith('otpauth://totp/'));
		assert.isTrue(uri.includes('secret=' + encodeURIComponent(secret)));
		assert.isTrue(uri.includes('issuer=Foundry'));
		assert.isTrue(uri.includes('period=30'));
		assert.isTrue(uri.includes('digits=6'));
		assert.isTrue(uri.includes('algorithm=SHA1'));
	});
});
