import { belongsTo, computed } from '@adonisjs/lucid/orm';
import { Token as TokenEntity } from '#auth/domain/token';
import { type TokenType } from '#auth/enums/token_type';
import { TokenSchema } from '#database/schema';
import User from '#identity/models/user';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

export default class Token extends TokenSchema {
	@belongsTo(() => User)
	declare public user: BelongsTo<typeof User>;

	/**
	 * Check if token is expired
	 */
	@computed()
	get isExpired(): boolean {
		return this.toDomain().isExpired();
	}

	/**
	 * Project this model onto its pure domain representation. The expiration
	 * and attempt-lockout invariants live on the domain object; these getters
	 * are thin delegations.
	 */
	toDomain(): TokenEntity {
		return TokenEntity.fromModel({
			id: this.id,
			userId: this.userId,
			type: this.type as TokenType,
			selector: this.selector,
			expiresAt: this.expiresAt ? this.expiresAt.toJSDate() : null,
			attempts: this.attempts,
		});
	}
}
