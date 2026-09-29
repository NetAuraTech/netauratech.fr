import { inject } from '@adonisjs/core';
import hash from '@adonisjs/core/services/hash';
import { DateTime } from 'luxon';
import { Token } from '#auth/domain/token';
import { type FullToken, type TokenType } from '#auth/enums/token_type';
import InvalidTokenException from '#auth/exceptions/invalid_token_exception';
import MaxAttemptsExceededException from '#auth/exceptions/max_attempts_exceeded_exception';
import { TokenRepository } from '#auth/repositories/token_repository';
import { withTransaction } from '#core/services/with_transaction';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

/**
 * The single module for the Token lifecycle (selector/validator credentials).
 *
 * Sits on top of the pure-query {@link TokenRepository} and owns every token
 * policy: the issuance choreography (expire outstanding tokens → generate
 * the split token → hash the validator → persist), full verification with
 * attempt accounting and brute-force lockout, token → user resolution, and
 * the atomic consume choreography (lock → re-check → act → expire) that
 * makes every consuming flow single-use. Every token flow — email
 * verification, password reset, email change, pending invites — issues,
 * verifies, and resolves tokens exclusively through this module, so each
 * token invariant is enforced exactly once.
 *
 * Failure semantics: every operation throws the typed token exceptions —
 * {@link InvalidTokenException} for a malformed, unknown, expired, or
 * invalid token, {@link MaxAttemptsExceededException} for a locked token —
 * so callers never handle a `null` return. A locked token is a distinct,
 * client-relevant state (HTTP 429), never a plain "invalid token".
 */
@inject()
export class TokenService {
	/**
	 * Maximum verification attempts allowed for any token type before the
	 * token is locked against brute-force verification.
	 */
	readonly MAX_ATTEMPTS = 3;

	constructor(
		protected tokenRepository: TokenRepository,
		protected logService: LogService,
	) {}

	/**
	 * Issues a new token for a user: expires the user's outstanding tokens of
	 * the type, generates a fresh split token (`selector`, `validator`),
	 * hashes the validator, and persists the record.
	 *
	 * The single issuance path for every token type — the mail flows
	 * (verification, reset, invitation, email change) all delegate here
	 * instead of re-deriving the choreography.
	 *
	 * @param user - The token owner.
	 * @param type - The token type to issue.
	 * @param expiresInHours - Token lifetime in hours.
	 * @returns The raw `selector.validator` token to hand to the user.
	 *
	 * @example
	 * const token = await tokenService.issue(user, TOKEN_TYPES.PASSWORD_RESET, 1)
	 */
	async issue(user: User, type: TokenType, expiresInHours: number): Promise<FullToken> {
		await this.tokenRepository.expireTokensByType(user, type);

		const { selector, validator, token } = Token.generateSplit();
		const hashedValidator = await hash.make(validator);

		await this.tokenRepository.create({
			userId: user.id,
			type,
			selector,
			token: hashedValidator,
			attempts: 0,
			expiresAt: DateTime.now().plus({ hours: expiresInHours }),
		});

		return token;
	}

	/**
	 * Fully verifies a token: enforces the brute-force lockout, records one
	 * verification attempt, and validates the validator hash against the
	 * stored record.
	 *
	 * Every presentation consumes exactly one attempt against an existing
	 * record (valid, invalid, or expired alike); an unknown selector or a
	 * malformed token consumes nothing — there is no record to increment.
	 * Once the counter reaches {@link MAX_ATTEMPTS}, further presentations
	 * throw {@link MaxAttemptsExceededException} without incrementing.
	 *
	 * @param token - The raw `selector.validator` token.
	 * @param type - The expected token type.
	 * @throws {InvalidTokenException} When the token is malformed, unknown,
	 *   expired, or its validator does not match.
	 * @throws {MaxAttemptsExceededException} When the attempt counter has
	 *   reached or exceeded the maximum allowed attempts.
	 *
	 * @example
	 * await tokenService.verify(token, TOKEN_TYPES.PASSWORD_RESET)
	 */
	async verify(token: FullToken, type: TokenType): Promise<void> {
		const parts = this.splitOrThrow(token, type);

		const outcome = await this.tokenRepository.checkAndIncrementAttempt(parts.selector, this.MAX_ATTEMPTS);

		if (outcome?.lockedOut) {
			throw new MaxAttemptsExceededException();
		}

		const record = await this.tokenRepository.findBySelector(parts.selector, type);

		if (!record || !(await hash.verify(record.token, parts.validator))) {
			this.logInvalid(token, type, record?.userId ?? undefined);
			throw new InvalidTokenException();
		}
	}

	/**
	 * Resolves a valid token to its associated {@link User}, with the user's
	 * role and permissions preloaded.
	 *
	 * Runs the full {@link verify} first, so the presentation consumes one
	 * attempt and a locked token throws the distinct 429 state.
	 *
	 * @param token - The raw `selector.validator` token.
	 * @param type - The expected token type.
	 * @returns The associated {@link User}.
	 * @throws {InvalidTokenException} When the token is malformed, unknown,
	 *   expired, invalid, or its user no longer exists.
	 * @throws {MaxAttemptsExceededException} When the attempt counter has
	 *   reached or exceeded the maximum allowed attempts.
	 *
	 * @example
	 * const user = await tokenService.resolveUser(token, TOKEN_TYPES.PASSWORD_RESET)
	 */
	async resolveUser(token: FullToken, type: TokenType): Promise<User> {
		const parts = this.splitOrThrow(token, type);

		await this.verify(token, type);

		const user = await this.tokenRepository.findUserBySelector(parts.selector, type);

		if (!user) {
			this.logInvalid(token, type);
			throw new InvalidTokenException();
		}

		return user;
	}

	/**
	 * Consumes a token: resolves the user, then runs the consuming flow's
	 * `act` atomically inside one transaction — lock the token row
	 * exclusively (first query of the transaction), re-check that it is still
	 * usable, run `act`, then expire the outstanding tokens of the type.
	 *
	 * The single consuming entry point for every token flow (email
	 * verification, password reset, email-change confirmation, invitation
	 * acceptance): the lock / re-check / act / expire choreography exists
	 * exactly once, here, so a caller cannot skip the lock
	 * (see /docs/agents/toctou-protection.md). {@link resolveUser} runs
	 * before the transaction — consuming exactly one attempt — and the
	 * exclusive `SELECT ... FOR UPDATE` then serializes concurrent
	 * presentations of the same token: by the time a second transaction
	 * reaches the lock the first has already committed and expired the
	 * token, so the re-check below rejects it.
	 *
	 * A rejected presentation is audited with `logSecurity` before the
	 * exception is thrown — a token consumed concurrently is a security
	 * signal, not an ordinary invalid-token case. When `act` throws, the
	 * transaction rolls back and the token stays unconsumed.
	 *
	 * @typeParam T - The type of the value `act` returns.
	 * @param token - The raw `selector.validator` token.
	 * @param type - The expected token type.
	 * @param act - The consuming flow's work, run while the token row is
	 *   locked; it receives the token's {@link User}.
	 * @returns The value returned by `act`.
	 * @throws {InvalidTokenException} When the token is malformed, unknown,
	 *   expired, invalid, or already consumed by a concurrent presentation.
	 * @throws {MaxAttemptsExceededException} When the attempt counter has
	 *   reached or exceeded the maximum allowed attempts.
	 *
	 * @example
	 * const user = await tokenService.consume(token, TOKEN_TYPES.PASSWORD_RESET, async (u) => {
	 *   return u
	 * })
	 */
	async consume<T>(token: FullToken, type: TokenType, act: (user: User) => Promise<T>): Promise<T> {
		const parts = this.splitOrThrow(token, type);

		const user = await this.resolveUser(token, type);

		return withTransaction(async () => {
			const record = await this.tokenRepository.lockBySelector(parts.selector, type);

			if (!record || record.isExpired) {
				this.logService.logSecurity('core.token.double_use_rejected', {
					userId: record?.userId ?? undefined,
					type,
					token: Token.mask(token),
				});

				throw new InvalidTokenException();
			}

			const result = await act(user);
			await this.tokenRepository.expireTokensByType(user, type);
			return result;
		});
	}

	/**
	 * Splits a full token into its selector/validator parts, auditing and
	 * throwing the invalid-token state for a malformed presentation.
	 *
	 * @param token - The raw `selector.validator` token.
	 * @param type - The token type the presentation was made against.
	 * @returns The token parts.
	 * @throws {InvalidTokenException} When the token format is invalid.
	 */
	private splitOrThrow(token: FullToken, type: TokenType) {
		const parts = Token.split(token);

		if (!parts) {
			this.logInvalid(token, type);
			throw new InvalidTokenException();
		}

		return parts;
	}

	/**
	 * Records a failed token presentation in the audit trail with a masked
	 * token.
	 *
	 * @param token - The raw `selector.validator` token.
	 * @param type - The token type the presentation was made against.
	 * @param userId - The token owner, when the record was found.
	 */
	protected logInvalid(token: FullToken, type: TokenType, userId?: number) {
		this.logService.logAuth('core.token.invalid', {
			userId,
			type,
			token: Token.mask(token),
		});
	}
}
