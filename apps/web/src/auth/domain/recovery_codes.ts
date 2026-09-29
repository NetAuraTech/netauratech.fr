import { randomInt } from 'node:crypto';

/**
 * Unambiguous alphabet: no `0`/`O`, `1`/`I`/`L`, so a code read off a screen
 * or typed by hand cannot be confused with a look-alike character.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const GROUP_LENGTH = 5;
const GROUPS = 2;

/**
 * Pure helpers for one-time two-factor recovery codes.
 *
 * A recovery code is a short human-transcribable secret (two groups of five
 * characters) that substitutes for the TOTP code when the user has lost access
 * to their authenticator device. Codes are generated here and held in memory;
 * persistence (encrypted at rest) and one-time consumption live in the
 * {@link #auth/services/two_factor_service}.
 *
 * @example
 * const codes = RecoveryCodes.generate(10)
 * RecoveryCodes.normalize(' ab12c-de34f ') // 'AB12CDE34F'
 */
export const RecoveryCodes = {
	/**
	 * Generates a single recovery code, formatted as `XXXXX-XXXXX`.
	 *
	 * Each character is drawn with `crypto.randomInt`, so the output is
	 * cryptographically random.
	 */
	generateOne(): string {
		let out = '';
		for (let i = 0; i < GROUP_LENGTH * GROUPS; i++) {
			if (i === GROUP_LENGTH) {
				out += '-';
			}
			out += ALPHABET[randomInt(ALPHABET.length)];
		}
		return out;
	},

	/**
	 * Generates a set of distinct recovery codes.
	 *
	 * @param count - How many codes to generate (default 10).
	 * @returns An array of formatted recovery codes.
	 */
	generate(count = 10): string[] {
		const codes = new Set<string>();
		while (codes.size < count) {
			codes.add(this.generateOne());
		}
		return [...codes];
	},

	/**
	 * Normalises user input for comparison: trims, upper-cases, and strips
	 * every character outside the code alphabet (spaces, dashes, etc.).
	 *
	 * The result is the raw character run with no separators, so `ab12c-de34f`
	 * and `AB12C DE34F` both normalise to `AB12CDE34F`.
	 */
	normalize(input: string): string {
		return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
	},
} as const;
