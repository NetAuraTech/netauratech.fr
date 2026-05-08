import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { afterFetch, afterFind, belongsTo, computed, hasMany, hasOne } from '@adonisjs/lucid/orm'
import Role from '#models/auth/role'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import UserPreference from '#models/preferences/user_preference'
import Token from '#models/core/token'
import { TOKEN_TYPES } from '#types/core'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @hasOne(() => UserPreference)
  declare preference: HasOne<typeof UserPreference>

  @hasMany(() => Token)
  declare tokens: HasMany<typeof Token>

  declare hasPendingInvite: boolean

  @afterFind()
  static async loadPendingInvite(user: User) {
    if (!user?.id) {
      return
    }
    user.hasPendingInvite = false

    const token = await Token.query()
      .where('type', TOKEN_TYPES.PENDING_INVITE)
      .where('user_id', user.id)
      .first()

    user.hasPendingInvite = !!token && !user.isEmailVerified
  }

  @afterFetch()
  static async loadPendingInviteAll(users: User[]) {
    await Promise.all(users.map(User.loadPendingInvite))
  }

  @computed()
  get status(): string {
    if (this.hasPendingInvite) return TOKEN_TYPES.PENDING_INVITE
    if (this.isEmailVerified) return 'VERIFIED'
    return 'UNVERIFIED'
  }

  get isEmailVerified(): boolean {
    return this.emailVerifiedAt !== null && this.emailVerifiedAt !== undefined
  }

  async can(slug: string): Promise<boolean> {
    if (!this.roleId) {
      return false
    }

    const role = await (this as User).related('role').query().preload('permissions').first()

    if (!role) {
      return false
    }

    return role.permissions.some((p) => p.slug === slug)
  }

  async hasAnyRole(slugs: string[]): Promise<boolean> {
    if (!this.roleId) {
      return false
    }

    const role = await (this as User).related('role').query().first()
    return role ? slugs.includes(role.slug) : false
  }
}
