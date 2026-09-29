import { inject } from '@adonisjs/core';
import hash from '@adonisjs/core/services/hash';
import { RecoveryCodes } from '#auth/domain/recovery_codes';
import { Totp } from '#auth/domain/totp';
import { createTwoFactorCipher } from '#auth/domain/two_factor_cipher';
import InvalidCurrentPasswordException from '#auth/exceptions/invalid_current_password_exception';
import InvalidTwoFactorCodeException from '#auth/exceptions/invalid_two_factor_code_exception';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import { withTransaction } from '#core/services/with_transaction';
import User from '#identity/models/user';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';
import env from '#start/env';

/**
 * Business logic for TOTP-based two-factor authentication.
 *
 * Owns the secret's lifecycle: generating a fresh secret for enrollment,
 * persisting it **encrypted at rest**, and verifying codes at both
 * enrollment-confirmation and login time. The plaintext secret is only ever
 * held in-memory (or in the caller's transient session) — it is never written
 * to the database.
 *
 * Recovery codes give a 2FA-enabled user a fallback when their authenticator
 * device is lost. A set of one-time codes is generated at enrollment and
 * stored **encrypted at rest** alongside the secret (same cipher, same threat
 * model as the secret itself). Each code is usable exactly once: consuming a
 * code at login removes it from the stored set.
 */
@inject()
export class TwoFactorService {
	/** Number of one-time recovery codes issued per enrollment. */
	static readonly RECOVERY_CODE_COUNT = 10;

	/**
	 * AES-256-GCM cipher keyed on the application key. Constructed once per
	 * instance; the key is stable for the process lifetime.
	 */
	private readonly cipher = createTwoFactorCipher(env.get('APP_KEY').release());

	constructor(
		protected userRepository: UserRepository,
		protected logService: LogService,
	) {}

	/**
	 * Begins an enrollment: generates a fresh secret and its `otpauth://`
	 * provisioning URI.
	 *
	 * Nothing is persisted — the caller is responsible for holding the
	 * plaintext secret (typically the server-side session) until the user
	 * confirms it with a valid code via {@link confirmEnrollment}.
	 *
	 * @param user - The user enrolling.
	 * @returns The plaintext base32 secret and its provisioning URI.
	 */
	beginEnrollment(user: User): { secret: string; otpauthUri: string } {
		const secret = Totp.generateSecret();
		const otpauthUri = Totp.otpauthUri(secret, user.email, env.get('APP_NAME'));
		return { secret, otpauthUri };
	}

	/**
	 * Confirms an enrollment: verifies the code against the pending secret,
	 * then stores the encrypted secret, issues a fresh set of one-time
	 * recovery codes (encrypted at rest), and enables 2FA for the user.
	 *
	 * @param user - The user enrolling.
	 * @param code - The 6-digit code the user entered from their authenticator.
	 * @param pendingSecret - The plaintext secret from {@link beginEnrollment}.
	 * @returns The updated {@link User} with 2FA enabled, plus the freshly
	 *   generated plaintext recovery codes. The caller surfaces them so the
	 *   user can save them; they also remain (encrypted) retrievable from
	 *   account settings via {@link getRecoveryCodes} until used.
	 * @throws {InvalidTwoFactorCodeException} If the code does not match.
	 */
	async confirmEnrollment(
		user: User,
		code: string,
		pendingSecret: string,
	): Promise<{ user: User; recoveryCodes: string[] }> {
		if (!Totp.verify(pendingSecret, code)) {
			this.logService.logSecurity('two_factor.enrollment_failed', {
				userId: user.id,
				userEmail: user.email,
			});
			throw new InvalidTwoFactorCodeException();
		}

		const recoveryCodes = RecoveryCodes.generate(TwoFactorService.RECOVERY_CODE_COUNT);

		const updated = await this.userRepository.update(user, {
			twoFactorSecret: this.cipher.encrypt(pendingSecret),
			twoFactorRecoveryCodes: this.cipher.encrypt(JSON.stringify(recoveryCodes)),
			twoFactorEnabled: true,
		});

		this.logService.logAuth('two_factor.enrolled', {
			userId: updated.id,
			userEmail: updated.email,
		});

		return { user: updated, recoveryCodes };
	}

	/**
	 * Returns the user's remaining unused recovery codes, decrypted from the
	 * stored set. An empty array when the user has none left (or none issued).
	 *
	 * @param user - The user whose recovery codes to list.
	 */
	getRecoveryCodes(user: User): string[] {
		return this.readRecoveryCodes(user);
	}

	/**
	 * Verifies a login code for a user who has 2FA enabled.
	 *
	 * Accepts either a valid TOTP code (checked first, against the decrypted
	 * stored secret) or a valid unused recovery code. A recovery code that is
	 * accepted is **consumed** — removed from the stored set — so each code
	 * works exactly once. On any failure it records a security event and
	 * throws.
	 *
	 * @param user - The user attempting to log in (2FA must be enabled).
	 * @param code - The code entered at the login challenge (TOTP or recovery).
	 * @returns The {@link User} if the code is valid.
	 * @throws {InvalidTwoFactorCodeException} If the code is neither a valid
	 *   TOTP code nor an unused recovery code.
	 */
	async verifyLoginCode(user: User, code: string): Promise<User> {
		if (await this.checkTotp(user, code)) {
			return user;
		}

		if (await this.consumeRecoveryCode(user, code)) {
			this.logService.logSecurity('two_factor.login.recovery_used', {
				userId: user.id,
				userEmail: user.email,
			});
			return user;
		}

		this.logService.logSecurity('two_factor.login.failed', {
			userId: user.id,
			userEmail: user.email,
		});
		throw new InvalidTwoFactorCodeException();
	}

	/**
	 * Disables 2FA for the user.
	 *
	 * Requires the user's current password **and** a valid TOTP or recovery
	 * code — so a session that has been hijacked without the password or the
	 * second factor cannot strip the account's 2FA. On success the secret and
	 * the recovery codes are cleared and 2FA is turned off; re-enrolling
	 * afterwards issues a fresh secret and a fresh set of recovery codes.
	 *
	 * @param user - The user whose 2FA is being disabled.
	 * @param currentPassword - The user's current (plain-text) password.
	 * @param code - A valid TOTP code or an unused recovery code.
	 * @returns The updated {@link User} with 2FA disabled.
	 * @throws {InvalidCurrentPasswordException} If the password does not match.
	 * @throws {InvalidTwoFactorCodeException} If the code is not a valid TOTP
	 *   code nor an unused recovery code.
	 */
	async disableTwoFactor(user: User, currentPassword: string, code: string): Promise<User> {
		const isPasswordValid = user.password ? await hash.verify(user.password, currentPassword) : false;
		if (!isPasswordValid) {
			this.logService.logSecurity('two_factor.disable.failed_invalid_password', {
				userId: user.id,
				userEmail: user.email,
			});
			throw new InvalidCurrentPasswordException();
		}

		// The second-factor check and the 2FA teardown must be atomic against a
		// concurrent disable or recovery-code login: the row is locked with
		// SELECT ... FOR UPDATE so the code is validated and cleared in one
		// step (see /docs/agents/toctou-protection.md).
		return withTransaction(async () => {
			const locked = await this.userRepository.findByIdForUpdate(user.id);
			if (!locked) {
				throw new RowNotFoundException(User);
			}

			const isValidCode = (await this.checkTotp(locked, code)) || this.findRecoveryCodeIndex(locked, code) !== -1;
			if (!isValidCode) {
				this.logService.logSecurity('two_factor.disable.failed_invalid_code', {
					userId: user.id,
					userEmail: user.email,
				});
				throw new InvalidTwoFactorCodeException();
			}

			const updated = await this.userRepository.update(locked, {
				twoFactorEnabled: false,
				twoFactorSecret: null,
				twoFactorRecoveryCodes: null,
			});

			this.logService.logAuth('two_factor.disabled', {
				userId: updated.id,
				userEmail: updated.email,
			});

			return updated;
		});
	}

	/**
	 * Checks a code against the user's stored TOTP secret (decrypted) using the
	 * standard time window. Returns `false` when the user has no secret or the
	 * secret cannot be read, without throwing.
	 */
	private async checkTotp(user: User, code: string): Promise<boolean> {
		if (!user.twoFactorSecret) {
			return false;
		}

		let secret: string;
		try {
			secret = this.cipher.decrypt(user.twoFactorSecret);
		} catch {
			this.logService.logSecurity('two_factor.login.failed_decrypt', {
				userId: user.id,
				userEmail: user.email,
			});
			return false;
		}

		return Totp.verify(secret, code);
	}

	/**
	 * Consumes a recovery code: if an unused code matches the (normalised)
	 * input it is removed from the stored set and the new set persisted.
	 *
	 * The "still unused" check and the removal are atomic: the row is locked
	 * with `SELECT ... FOR UPDATE` inside a transaction, so two concurrent
	 * logins presenting the same code are serialised and only one can consume
	 * it — the single-use guarantee holds under contention (see
	 * /docs/agents/toctou-protection.md).
	 *
	 * @returns `true` when a matching unused code was found and removed.
	 */
	private async consumeRecoveryCode(user: User, code: string): Promise<boolean> {
		return withTransaction(async () => {
			const locked = await this.userRepository.findByIdForUpdate(user.id);
			if (!locked) {
				return false;
			}

			const index = this.findRecoveryCodeIndex(locked, code);
			if (index === -1) {
				return false;
			}

			const codes = this.readRecoveryCodes(locked);
			codes.splice(index, 1);

			await this.userRepository.update(locked, {
				twoFactorRecoveryCodes: codes.length ? this.cipher.encrypt(JSON.stringify(codes)) : null,
			});
			return true;
		});
	}

	/**
	 * Decrypts the stored recovery-code set for the user.
	 *
	 * @returns The array of remaining codes, or `[]` when none are stored or
	 *   the stored value cannot be read.
	 */
	private readRecoveryCodes(user: User): string[] {
		if (!user.twoFactorRecoveryCodes) {
			return [];
		}

		try {
			const parsed = JSON.parse(this.cipher.decrypt(user.twoFactorRecoveryCodes));
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	/**
	 * Index of the stored recovery code matching the (normalised) input, or
	 * `-1` when there is no match.
	 */
	private findRecoveryCodeIndex(user: User, code: string): number {
		const normalized = RecoveryCodes.normalize(code);
		if (!normalized) {
			return -1;
		}
		return this.readRecoveryCodes(user).findIndex((c) => RecoveryCodes.normalize(c) === normalized);
	}
}
