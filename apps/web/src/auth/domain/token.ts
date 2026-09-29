import { randomBytes } from 'node:crypto';
import { TokenIdentifier } from '#auth/domain/identifiers';
import { Entity } from '#core/domain/entity';
import type { FullToken, TokenType } from '#auth/enums/token_type';

/**
 * The two parts of a split token.
 *
 * The {@link TokenParts.selector} is stored in plain text in the database for
 * efficient lookup, while the {@link TokenParts.validator} is hashed so that a
 * database leak does not expose usable tokens.
 */
interface TokenParts {
	selector: string;
	validator: string;
}

/**
 * A generated split token: the parts plus the full `selector.validator`
 * string that is handed to the user (mail link, response body).
 */
interface GeneratedToken extends TokenParts {
	token: FullToken;
}

/**
 * Pure domain object for an auth {@link Token}.
 *
 * Carries the token's persisted state (identity, owner, type, selector,
 * expiration, attempt counter) and the invariants over it — expiration and
 * attempt-lockout — outside the persistence layer. The selector/validator
 * generation, parsing, and masking rules live on the class as static
 * helpers, shared by the {@link TokenRepository} (persistence) and the mail
 * flows (presentation links). Hydrate one from a model with
 * {@link Token.fromModel}.
 */
export class Token extends Entity<{
	id: TokenIdentifier;
	userId: number | null;
	type: TokenType;
	selector: string | null;
	expiresAt: Date | null;
	attempts: number;
}> {
	private constructor(
		readonly id: TokenIdentifier,
		readonly userId: number | null,
		readonly type: TokenType,
		readonly selector: string | null,
		readonly expiresAt: Date | null,
		readonly attempts: number,
	) {
		super({ id, userId, type, selector, expiresAt, attempts });
	}

	/**
	 * Hydrate a domain token from its Lucid model representation.
	 *
	 * @param model - The persisted token. The hashed validator column is
	 *   deliberately not carried — hash verification is a persistence concern.
	 */
	static fromModel(model: {
		id: number;
		userId: number | null;
		type: TokenType;
		selector: string | null;
		expiresAt: Date | null;
		attempts: number;
	}): Token {
		return new Token(
			TokenIdentifier.of(model.id),
			model.userId,
			model.type,
			model.selector,
			model.expiresAt,
			model.attempts,
		);
	}

	/**
	 * Generates a random hex token string.
	 *
	 * @param length - Length of the token in bytes (default 32, 64 hex chars).
	 * @returns The random hex string.
	 */
	static generate(length: number = 32): string {
		return randomBytes(length).toString('hex');
	}

	/**
	 * Generates a selector/validator token pair.
	 *
	 * @param selectorLength - Selector length in bytes (default 32).
	 * @param validatorLength - Validator length in bytes (default 32).
	 * @returns The generated parts and the full `selector.validator` token.
	 *
	 * @example
	 * const { selector, validator, token } = Token.generateSplit()
	 * // selector: "abc123..." (stored in DB as-is)
	 * // validator: "def456..." (hashed before storage)
	 * // token: "abc123....def456..." (sent to the user)
	 */
	static generateSplit(selectorLength: number = 32, validatorLength: number = 32): GeneratedToken {
		const selector = Token.generate(selectorLength);
		const validator = Token.generate(validatorLength);
		const token = `${selector}.${validator}` as FullToken;

		return { selector, validator, token };
	}

	/**
	 * Splits a full `selector.validator` string into its two components.
	 *
	 * @param token - The full token string.
	 * @returns The parts, or `null` when the format is invalid.
	 */
	static split(token: FullToken): TokenParts | null {
		const parts = token.split('.');

		if (parts.length !== 2) {
			return null;
		}

		const [selector, validator] = parts;

		if (!selector || !validator) {
			return null;
		}

		return { selector, validator };
	}

	/**
	 * Masks a token for safe logging.
	 *
	 * Keeps the first 8 and last 4 characters and masks the rest, so logs
	 * never expose a usable token.
	 *
	 * @param token - The token (or selector) to mask.
	 * @returns The masked representation.
	 */
	static mask(token: string): string {
		if (token.length <= 12) {
			return token;
		}

		const start = token.slice(0, 8);
		const end = token.slice(-4);
		const masked = '*'.repeat(Math.min(token.length - 12, 20));

		return `${start}${masked}${end}`;
	}

	/**
	 * Whether this token is past its expiration.
	 *
	 * A token without an expiration stamp is invalid, not timeless.
	 *
	 * @param now - The reference time (defaults to the current time).
	 */
	isExpired(now: Date = new Date()): boolean {
		return this.expiresAt === null || this.expiresAt.getTime() <= now.getTime();
	}

	/**
	 * Whether the attempt counter has reached the allowed maximum, i.e. the
	 * token is locked against brute-force verification.
	 *
	 * @param maxAttempts - The maximum number of verification attempts.
	 */
	hasExceededAttempts(maxAttempts: number): boolean {
		return this.attempts >= maxAttempts;
	}
}
