import { inject } from '@adonisjs/core';
import { DateTime } from 'luxon';
import { type TokenType } from '#auth/enums/token_type';
import TokenModel from '#auth/models/token';
import { BaseRepository } from '#core/repositories/base_repository';
import { transactionContext } from '#core/services/transaction_context';
import { withTransaction } from '#core/services/with_transaction';
import User from '#identity/models/user';

/**
 * Outcome of an atomic attempt check: the locked record plus whether the
 * attempt cap was already reached (no increment performed).
 */
export interface AttemptCheckResult {
	record: TokenModel;
	lockedOut: boolean;
}

/**
 * Pure-query persistence for {@link TokenModel} records.
 *
 * Tokens follow the **selector/validator pattern**: the selector is stored
 * in plain text for fast database lookup, while the validator is hashed so
 * that a database leak does not expose usable tokens.
 *
 * This repository is deliberately policy-free: it exposes token lookups,
 * writes, bulk expiration, the exclusive row lock, the atomic
 * attempt-counter primitive, and the token → user read. Every lifecycle
 * policy — the issuance choreography, verification with lockout, exception
 * mapping — lives in the {@link TokenService}, which is the single module
 * for the Token lifecycle.
 */
@inject()
export class TokenRepository extends BaseRepository {
	/**
	 * Finds a token by its primary key.
	 *
	 * @param id - The token's primary key.
	 * @returns The matching token model, or `null` if not found.
	 *
	 * @example
	 * const token = await tokenRepository.findById(1)
	 */
	async findById(id: number): Promise<TokenModel | null> {
		return await TokenModel.query(this.client()).where('id', id).first();
	}

	/**
	 * Creates and persists a new token.
	 *
	 * The `token` field should contain the **hashed** validator — plain-text
	 * validators must be hashed by the caller before being passed here.
	 *
	 * @param data - The token data to persist.
	 * @returns The newly created token record.
	 *
	 * @example
	 * const token = await tokenRepository.create({ userId, type, selector, token: hashedValidator })
	 */
	async create(data: Partial<TokenModel>): Promise<TokenModel> {
		return TokenModel.create(data as any, this.client());
	}

	/**
	 * Updates a token by its primary key.
	 *
	 * @param id - The primary key of the token to update.
	 * @param data - Partial token fields to merge into the record.
	 * @returns The updated token record, or `null` if not found.
	 */
	async update(id: number, data: Partial<TokenModel>): Promise<TokenModel | null> {
		const token = await this.findById(id);

		if (!token) return null;

		token.merge(data as any);
		await transactionContext.merge(token);
		await token.save();
		return token;
	}

	/**
	 * Deletes a token by its primary key.
	 *
	 * @param id - The primary key of the token to delete.
	 * @returns `true` if deleted, `false` if not found.
	 */
	async delete(id: number): Promise<boolean> {
		const token = await this.findById(id);

		if (!token) return false;

		await token.delete();
		return true;
	}

	/**
	 * Finds a usable token record by its plain-text selector and expected type.
	 *
	 * Does not verify the validator hash — verification is a
	 * {@link TokenService} concern. Returns `null` if no matching record
	 * exists or if the token has expired.
	 *
	 * @param selector - The plain-text selector portion of the token.
	 * @param type - The expected token type to filter by.
	 * @returns The matching token record, or `null`.
	 */
	async findBySelector(selector: string, type: TokenType): Promise<TokenModel | null> {
		return await TokenModel.query(this.client())
			.where('selector', selector)
			.where('type', type)
			.where('expires_at', '>', DateTime.now().toSQL())
			.first();
	}

	/**
	 * Acquires the token row with an exclusive lock
	 * (`SELECT ... FOR UPDATE`) without asserting anything about its state.
	 *
	 * Must be the **first query** of the transaction that acts on the token
	 * (see /docs/agents/toctou-protection.md): the exclusive lock serializes
	 * concurrent presentations of the same token. The caller re-checks the
	 * record's usability (e.g. {@link TokenModel.isExpired}) and maps the
	 * outcome — this repository throws nothing.
	 *
	 * @param selector - The plain-text selector portion of the token.
	 * @param type - The expected token type to filter by.
	 * @returns The locked token record, or `null` if no matching record exists.
	 */
	async lockBySelector(selector: string, type: TokenType): Promise<TokenModel | null> {
		return await TokenModel.query(this.client()).where('selector', selector).where('type', type).forUpdate().first();
	}

	/**
	 * Resolves a token record to its associated {@link User}, with the user's
	 * role and permissions preloaded.
	 *
	 * Pure read: no verification and no attempt accounting — the caller
	 * verifies the token first (see {@link TokenService.resolveUser}).
	 *
	 * @param selector - The plain-text selector portion of the token.
	 * @param type - The expected token type to filter by.
	 * @returns The associated {@link User}, or `null` when the record, its
	 *   user link, or the user itself is missing.
	 */
	async findUserBySelector(selector: string, type: TokenType): Promise<User | null> {
		const data = await TokenModel.query(this.client())
			.where('selector', selector)
			.where('type', type)
			.where('expires_at', '>', DateTime.now().toSQL())
			.first();

		if (!data || !data.userId) return null;

		const user = await User.query(this.client()).where('id', data.userId).first();
		if (!user) return null;

		await user.load('role', (query) => {
			query.preload('permissions');
		});

		return user;
	}

	/**
	 * The single code path for attempt accounting: atomically checks the
	 * token's attempt counter and, when under the cap, records one
	 * verification attempt.
	 *
	 * The check and the increment run under an exclusive row lock inside a
	 * dedicated transaction (see /docs/agents/toctou-protection.md), so
	 * concurrent presentations of the same token are serialized — none of
	 * them can pass the cap check on a stale counter or clobber another
	 * presentation's increment. The cap itself is policy owned by the caller
	 * ({@link TokenService.MAX_ATTEMPTS}), not by this repository:
	 *
	 * - a record already at (or over) the cap is returned with `lockedOut`
	 *   and is **not** incremented;
	 * - a record under the cap is incremented by exactly one;
	 * - an unknown selector returns `null` — there is no record to touch.
	 *
	 * @param selector - The plain-text selector portion of the token.
	 * @param maxAttempts - The attempt cap to enforce.
	 * @returns The outcome for the locked record, or `null` when no record
	 *   exists for the selector.
	 */
	async checkAndIncrementAttempt(selector: string, maxAttempts: number): Promise<AttemptCheckResult | null> {
		return await withTransaction(async () => {
			const record = await TokenModel.query(this.client()).where('selector', selector).forUpdate().first();

			if (!record) return null;

			if (record.toDomain().hasExceededAttempts(maxAttempts)) {
				return { record, lockedOut: true };
			}

			record.attempts += 1;
			await transactionContext.merge(record);
			await record.save();
			return { record, lockedOut: false };
		});
	}

	/**
	 * Expires all tokens of a given type for a user.
	 *
	 * The bulk expiration used by the issuance choreography and the
	 * consuming flows. Sets `expiresAt` to now so that an audit trail is
	 * preserved — records are not deleted.
	 *
	 * @param user - The user whose tokens should be expired.
	 * @param type - The token type to filter by.
	 */
	async expireTokensByType(user: User, type: TokenType): Promise<void> {
		const tokens = await TokenModel.query(this.client()).where('user_id', user.id).where('type', type);

		for (const token of tokens) {
			token.expiresAt = DateTime.now();
			await transactionContext.merge(token);
			await token.save();
		}
	}
}
