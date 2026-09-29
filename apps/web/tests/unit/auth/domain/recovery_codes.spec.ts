import { test } from '@japa/runner';
import { RecoveryCodes } from '#auth/domain/recovery_codes';

/**
 * Unit seam for the pure recovery-code helpers: generation shape and
 * entropy, uniqueness of a generated set, and input normalisation.
 */
test.group('RecoveryCodes', () => {
	test('generateOne: returns a code in XXXXX-XXXXX shape over the safe alphabet', ({ assert }) => {
		const code = RecoveryCodes.generateOne();

		assert.match(code, /^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
		// No ambiguous characters (0, O, 1, I, L).
		assert.isFalse(/[0O1IL]/.test(code));
	});

	test('generate: returns the requested number of distinct codes', ({ assert }) => {
		const codes = RecoveryCodes.generate(10);

		assert.lengthOf(codes, 10);
		assert.lengthOf(new Set(codes), 10);
		codes.forEach((code) => assert.match(code, /^[A-Z2-9]{5}-[A-Z2-9]{5}$/));
	});

	test('normalize: upper-cases and strips separators, keeping only alphabet chars', ({ assert }) => {
		assert.equal(RecoveryCodes.normalize(' ab12c-de34f '), 'AB12CDE34F');
		assert.equal(RecoveryCodes.normalize('ab12c de34f'), 'AB12CDE34F');
		assert.equal(RecoveryCodes.normalize('ab12cde34f'), 'AB12CDE34F');
		assert.equal(RecoveryCodes.normalize('a!b#c$d%e&f'), 'ABCDEF');
		assert.equal(RecoveryCodes.normalize(''), '');
	});
});
