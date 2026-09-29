import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens';
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid';
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session';
import { compose } from '@adonisjs/core/helpers';
import hash from '@adonisjs/core/services/hash';
import { afterFetch, afterFind, beforeSave, belongsTo, computed, hasMany, hasOne } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';
import UserPreference from '#account/models/user_preference';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import Token from '#auth/models/token';
import { UserSchema } from '#database/schema';
import { User as UserEntity } from '#identity/domain/user';
import Role from '#identity/models/role';
import env from '#start/env';
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations';

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
	uids: ['email'],
	passwordColumnName: 'password',
});

export default class User extends compose(UserSchema, AuthFinder) {
	static rememberMeTokens = DbRememberMeTokensProvider.forModel(User);

	/**
	 * Opaque access tokens backing the `api` auth guard (see `config/auth.ts`).
	 * Default expiry is env-driven (`AUTH_API_TOKEN_EXPIRY`) so every issuance
	 * path — login endpoint, OAuth API mode, tests — gets the same lifetime.
	 */
	static accessTokens = DbAccessTokensProvider.forModel(User, {
		expiresIn: env.get('AUTH_API_TOKEN_EXPIRY') ?? '30 days',
	});

	@belongsTo(() => Role)
	declare role: BelongsTo<typeof Role>;

	@hasOne(() => UserPreference)
	declare preference: HasOne<typeof UserPreference>;

	@hasMany(() => Token)
	declare tokens: HasMany<typeof Token>;

	declare hasPendingInvite: boolean;

	/** In-memory cache of the role + permissions loaded by can() / checkAny(). */
	private _loadedRole: Role | null | undefined = undefined;

	@beforeSave()
	static invalidateRoleCache(user: User, event: 'update' | 'create') {
		// Invalidate the in-memory role cache on updates so a changed roleId is picked up.
		if (event === 'update') {
			user._loadedRole = undefined;
		}
	}

	@afterFind()
	static async loadPendingInvite(user: User) {
		if (!user?.id) {
			return;
		}
		user.hasPendingInvite = false;

		const token = await Token.query()
			.where('type', TOKEN_TYPES.PENDING_INVITE)
			.where('user_id', user.id)
			.where('expires_at', '>', DateTime.now().toSQL())
			.first();

		user.hasPendingInvite = !!token && !user.isEmailVerified;
	}

	@afterFetch()
	static async loadPendingInviteAll(users: User[]) {
		const userIds = users.map((u) => u.id).filter(Boolean);
		if (!userIds.length) {
			return;
		}

		// Single batched query — replaces the N+1 Promise.all(map(single-query)) pattern.
		const tokens = await Token.query()
			.where('type', TOKEN_TYPES.PENDING_INVITE)
			.whereIn('user_id', userIds)
			.where('expires_at', '>', DateTime.now().toSQL());

		// Build a lookup set of user-ids that have a pending invite token.
		const pendingUserIds = new Set(tokens.map((t) => t.userId));

		for (const user of users) {
			user.hasPendingInvite = pendingUserIds.has(user.id) && !user.isEmailVerified;
		}
	}

	@computed()
	get status(): string {
		return this.toDomain().status();
	}

	/**
	 * Project this model onto its pure domain representation. The derived
	 * lifecycle status lives on the domain object; this getter is a thin
	 * delegation.
	 */
	toDomain(): UserEntity {
		return UserEntity.fromModel({
			id: this.id,
			username: this.username,
			email: this.email,
			apiRateLimit: this.apiRateLimit,
			hasPendingInvite: this.hasPendingInvite,
			isEmailVerified: this.isEmailVerified,
			emailVerifiedAt: this.emailVerifiedAt?.toJSDate() ?? null,
			githubId: this.githubId,
			googleId: this.googleId,
			facebookId: this.facebookId,
			role: this.role ? this.role.toDomain() : null,
			createdAt: this.createdAt?.toJSDate() ?? null,
			updatedAt: this.updatedAt?.toJSDate() ?? null,
		});
	}

	get isEmailVerified(): boolean {
		return this.emailVerifiedAt !== null && this.emailVerifiedAt !== undefined;
	}

	/**
	 * Load the role with permissions once, caching it on the instance.
	 */
	async _loadRole(): Promise<Role | null> {
		if (this._loadedRole !== undefined) {
			return this._loadedRole;
		}

		if (!this.roleId) {
			this._loadedRole = null;
			return null;
		}

		const role = await (this as User).related('role').query().preload('permissions').first();
		this._loadedRole = role ?? null;
		return role;
	}

	/**
	 * Check if the user has a specific permission slug.
	 * Reuses the cached role on subsequent calls to avoid N+1 queries.
	 */
	async can(slug: string): Promise<boolean> {
		const role = await this._loadRole();
		if (!role) {
			return false;
		}
		return role.permissions.some((p) => p.slug === slug);
	}

	/**
	 * Check if the user has any of the given permission slugs.
	 * Loads the role + permissions once and checks all slugs in a single pass.
	 */
	async checkAny(slugs: string[]): Promise<boolean> {
		const role = await this._loadRole();
		if (!role) {
			return false;
		}
		return slugs.some((slug) => role.permissions.some((p) => p.slug === slug));
	}

	/**
	 * Check if the user's role slug is one of the given slugs.
	 * Loads the role directly (without permissions) rather than reusing the
	 * cached role from {@link can} / {@link checkAny}.
	 */
	async hasAnyRole(slugs: string[]): Promise<boolean> {
		if (!this.roleId) {
			return false;
		}

		const role = await (this as User).related('role').query().first();
		return role ? slugs.includes(role.slug) : false;
	}
}
