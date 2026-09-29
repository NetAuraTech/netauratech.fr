import { test } from '@japa/runner';
import { TwoFactorCipher, createTwoFactorCipher } from '#auth/domain/two_factor_cipher';

/**
 * Unit seam for the at-rest secret cipher. The guarantee under test is that a
 * secret round-trips and never appears in its plaintext form in the stored
 * payload; tampering or a wrong key must be rejected.
 */
test.group('TwoFactorCipher', () => {
	const appKey = 'test-app-key-0123456789abcdef';

	test('encrypt: output is base64 and does not contain the plaintext', ({ assert }) => {
		const cipher = createTwoFactorCipher(appKey);
		const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
		const encoded = cipher.encrypt(secret);

		assert.match(encoded, /^[A-Za-z0-9+/=]+$/);
		assert.isFalse(encoded.includes(secret));
	});

	test('round-trip: decrypt(encrypt(x)) === x', ({ assert }) => {
		const cipher = createTwoFactorCipher(appKey);
		const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
		assert.equal(cipher.decrypt(cipher.encrypt(secret)), secret);
	});

	test('each encryption is unique (fresh salt/IV)', ({ assert }) => {
		const cipher = createTwoFactorCipher(appKey);
		const a = cipher.encrypt('SAME');
		const b = cipher.encrypt('SAME');
		assert.notEqual(a, b);
		assert.equal(cipher.decrypt(a), 'SAME');
		assert.equal(cipher.decrypt(b), 'SAME');
	});

	test('decrypt: rejects a tampered payload', ({ assert }) => {
		const cipher = createTwoFactorCipher(appKey);
		const encoded = Buffer.from(cipher.encrypt('SECRET'));
		// Flip a bit in the ciphertext region.
		encoded[encoded.length - 4] ^= 0xff;
		assert.throws(() => cipher.decrypt(encoded.toString('base64')));
	});

	test('decrypt: rejects a value encrypted with a different key', ({ assert }) => {
		const a = createTwoFactorCipher(appKey);
		const b = createTwoFactorCipher('a-different-app-key-abcdef');
		const encoded = a.encrypt('SECRET');
		assert.throws(() => b.decrypt(encoded));
	});

	test('decrypt: rejects a truncated payload', ({ assert }) => {
		const cipher = createTwoFactorCipher(appKey);
		assert.throws(() => cipher.decrypt('aW52YWxpZA=='));
	});

	test('decrypt: rejects an empty payload', ({ assert }) => {
		const cipher = new TwoFactorCipher(appKey);
		assert.throws(() => cipher.decrypt(''));
	});
});
