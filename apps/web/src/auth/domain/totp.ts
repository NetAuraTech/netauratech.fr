import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** RFC 4648 base32 alphabet (uppercase, no padding). */
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const DEFAULT_PERIOD = 30;
const DEFAULT_DIGITS = 6;

/**
 * Pure TOTP (RFC 6238) / HOTP (RFC 4226) helpers for two-factor authentication.
 *
 * No I/O and no dependencies beyond `node:crypto`: the secret is a base32
 * string, codes are derived with HMAC-SHA1 over the 30-second time counter,
 * and verification is a constant-time comparison across a small time window.
 *
 * @example
 * const secret = Totp.generateSecret()
 * const code = Totp.code(secret)
 * Totp.verify(secret, code) // true
 */
export const Totp = {
	/**
	 * Encodes a buffer as an unpadded uppercase base32 string (RFC 4648).
	 */
	encodeBase32(buffer: Buffer): string {
		let bits = 0;
		let value = 0;
		let out = '';

		for (const byte of buffer) {
			value = (value << 8) | byte;
			bits += 8;
			while (bits >= 5) {
				out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
				bits -= 5;
			}
		}

		if (bits > 0) {
			out += B32_ALPHABET[(value << (5 - bits)) & 31];
		}

		return out;
	},

	/**
	 * Decodes an unpadded or padded base32 string back to its raw bytes.
	 * Whitespace and trailing `=` padding are ignored; unknown characters are skipped.
	 */
	decodeBase32(input: string): Buffer {
		const clean = input.replace(/=+$/g, '').replace(/\s/g, '').toUpperCase();
		let bits = 0;
		let value = 0;
		const bytes: number[] = [];

		for (const ch of clean) {
			const idx = B32_ALPHABET.indexOf(ch);
			if (idx === -1) continue;
			value = (value << 5) | idx;
			bits += 5;
			if (bits >= 8) {
				bytes.push((value >>> (bits - 8)) & 0xff);
				bits -= 8;
			}
		}

		return Buffer.from(bytes);
	},

	/**
	 * Generates a fresh TOTP secret as a base32 string.
	 *
	 * @param bytes - Number of random bytes to encode (default 20 = 160 bits).
	 */
	generateSecret(bytes = 20): string {
		return this.encodeBase32(randomBytes(bytes));
	},

	/**
	 * Builds an `otpauth://totp/` provisioning URI for authenticator apps.
	 */
	otpauthUri(
		secret: string,
		accountName: string,
		issuer: string,
		options: { period?: number; digits?: number } = {},
	): string {
		const { period = DEFAULT_PERIOD, digits = DEFAULT_DIGITS } = options;
		const label = encodeURIComponent(`${issuer}:${accountName}`);
		const query = [
			`secret=${encodeURIComponent(secret)}`,
			`issuer=${encodeURIComponent(issuer)}`,
			`period=${period}`,
			`digits=${digits}`,
			'algorithm=SHA1',
		].join('&');
		return `otpauth://totp/${label}?${query}`;
	},

	/**
	 * Computes the 6-digit TOTP code for the given secret at a point in time.
	 */
	code(secret: string, options: { timestampMs?: number; period?: number; digits?: number } = {}): string {
		const { timestampMs = Date.now(), period = DEFAULT_PERIOD, digits = DEFAULT_DIGITS } = options;
		const counter = Math.floor(timestampMs / 1000 / period);
		return this.hotp(secret, counter, digits);
	},

	/**
	 * Verifies a user-supplied code against the secret, accepting codes from
	 * the `window` periods before and after the current one.
	 *
	 * @returns `true` when the code matches one of the accepted windows.
	 */
	verify(
		secret: string,
		code: string,
		options: { timestampMs?: number; period?: number; digits?: number; window?: number } = {},
	): boolean {
		const { timestampMs = Date.now(), period = DEFAULT_PERIOD, digits = DEFAULT_DIGITS, window = 1 } = options;
		if (!new RegExp(`^\\d{${digits}}$`).test(code)) {
			return false;
		}

		const secretBytes = this.decodeBase32(secret);
		if (secretBytes.length === 0) {
			return false;
		}

		const counter = Math.floor(timestampMs / 1000 / period);

		for (let i = -window; i <= window; i++) {
			if (this.constantTimeEquals(this.hotp(secret, counter + i, digits), code)) {
				return true;
			}
		}

		return false;
	},

	/**
	 * Computes the raw HOTP code for a counter (used by {@link code} / {@link verify}).
	 */
	hotp(secret: string, counter: number, digits = DEFAULT_DIGITS): string {
		const secretBytes = this.decodeBase32(secret);
		const message = Buffer.alloc(8);
		message.writeBigUInt64BE(BigInt(counter));

		const hmac = createHmac('sha1', secretBytes).update(message).digest();
		const offset = hmac[hmac.length - 1] & 0x0f;
		const binary =
			((hmac[offset] & 0x7f) << 24) |
			((hmac[offset + 1] & 0xff) << 16) |
			((hmac[offset + 2] & 0xff) << 8) |
			(hmac[offset + 3] & 0xff);

		return (binary % 10 ** digits).toString().padStart(digits, '0');
	},

	/**
	 * Constant-time comparison of two equal-shape digit strings.
	 */
	constantTimeEquals(a: string, b: string): boolean {
		if (a.length !== b.length) {
			return false;
		}
		return timingSafeEqual(Buffer.from(a), Buffer.from(b));
	},
} as const;
