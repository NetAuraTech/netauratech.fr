import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const VERSION = 1;

/**
 * At-rest encryption for a user's TOTP secret.
 *
 * The secret is a short plaintext string; it must never be persisted in
 * plain text. This helper wraps AES-256-GCM with an scrypt key derived from
 * the application key plus a random per-value salt and IV, producing a
 * self-contained base64 payload of the shape
 * `[version(1)][salt(16)][iv(12)][ciphertext][tag(16)]` — the same envelope
 * as the backup domain's {@link #backup/services/encryption_helper}, but
 * self-contained so the auth domain does not couple to backup internals.
 */
export class TwoFactorCipher {
	private readonly appKey: string;

	/**
	 * @param appKey - The application secret key (e.g. the `APP_KEY` env var).
	 */
	constructor(appKey: string) {
		this.appKey = appKey;
	}

	/**
	 * Derives the 256-bit AES key from the app key and a per-value salt.
	 */
	private deriveKey(salt: Buffer): Buffer {
		return crypto.scryptSync(this.appKey, salt, KEY_LENGTH);
	}

	/**
	 * Encrypts a plaintext secret, returning a base64 string safe to store in a
	 * database column.
	 *
	 * @param plaintext - The raw TOTP secret (base32).
	 */
	encrypt(plaintext: string): string {
		const salt = crypto.randomBytes(SALT_LENGTH);
		const iv = crypto.randomBytes(IV_LENGTH);
		const key = this.deriveKey(salt);

		const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
		const data = Buffer.from(plaintext, 'utf-8');
		const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
		const authTag = cipher.getAuthTag();

		return Buffer.concat([Buffer.from([VERSION]), salt, iv, ciphertext, authTag]).toString('base64');
	}

	/**
	 * Decrypts a value produced by {@link encrypt}.
	 *
	 * @throws {Error} When the payload is malformed, an unsupported version, or
	 *   fails authentication (i.e. was tampered with or was produced with a
	 *   different key).
	 */
	decrypt(encoded: string): string {
		const data = Buffer.from(encoded, 'base64');

		const minLength = 1 + SALT_LENGTH + IV_LENGTH + TAG_LENGTH;
		if (data.length < minLength) {
			throw new Error('Invalid encrypted two-factor secret: too short');
		}
		if (data[0] !== VERSION) {
			throw new Error('Unsupported two-factor secret version');
		}

		const salt = data.subarray(1, 1 + SALT_LENGTH);
		const iv = data.subarray(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH);
		const ciphertext = data.subarray(1 + SALT_LENGTH + IV_LENGTH, -TAG_LENGTH);
		const authTag = data.subarray(-TAG_LENGTH);

		const key = this.deriveKey(salt);
		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
		decipher.setAuthTag(authTag);

		return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf-8');
	}
}

/**
 * Convenience factory that creates a {@link TwoFactorCipher} from the application key.
 *
 * @param appKey - The application secret key.
 * @returns A new {@link TwoFactorCipher} instance.
 */
export function createTwoFactorCipher(appKey: string): TwoFactorCipher {
	return new TwoFactorCipher(appKey);
}
