import { inject } from '@adonisjs/core'
import { LogService } from '#services/logging/log_service'
import { PaginationService } from '#services/pagination/pagination_service'
import User from '#models/auth/user'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import { PaginationFilters } from '#types/pagination'
import { UserRepository } from '#repositories/auth/user_repository'
import { events } from '#generated/events'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'
import { InvitationService } from '#services/auth/invitation_service'

interface ListFilters {
  /** Optional search term matched against `email` and `username`. */
  search?: string
  /** Optional role ID to restrict results to a specific role. */
  role?: string
}

/**
 * Handles CRUD operations on user accounts.
 *
 * User creation is delegated to {@link InvitationService} so that new
 * accounts are always bootstrapped through the invitation flow rather than
 * being created with a password directly.
 *
 * Email changes follow a two-step verification flow: the new address is
 * stored as `pendingEmail` and a confirmation event is dispatched; the
 * remaining fields are updated immediately.
 */
@inject()
export class UserService {
  constructor(
    protected logService: LogService,
    private paginationService: PaginationService,
    private invitationService: InvitationService,
    private userRepository: UserRepository
  ) {}

  /**
   * Returns a paginated, optionally filtered list of users.
   *
   * Each user is eager-loaded with their role and any active pending-invite
   * tokens (i.e. tokens that have not yet expired). Results are ordered from
   * newest to oldest.
   *
   * @param filters - Optional search and role filters.
   * @param pagination - Page number, page size, and ordering options.
   * @returns A paginated result set of {@link User} records.
   */
  async list(filters: ListFilters, pagination: PaginationFilters) {
    return this.paginationService.paginate({
      query: User.query()
        .preload('role')
        .preload('tokens', (q) => {
          q.where('type', TOKEN_TYPES.PENDING_INVITE).where(
            'expires_at',
            '>',
            DateTime.now().toSQL()
          )
        })
        .orderBy('created_at', 'desc'),
      filters: pagination,
      conditionalFilters: [
        {
          value: filters.search,
          apply: (q) =>
            q.where((builder) => {
              builder
                .whereILike('email', `%${filters.search}%`)
                .orWhereILike('username', `%${filters.search}%`)
            }),
        },
        {
          value: filters.role,
          apply: (q) => q.where('role_id', filters.role!),
        },
      ],
    })
  }

  /**
   * Returns a single user with their role and role permissions fully loaded.
   *
   * @param id - The ID of the user to retrieve.
   * @returns The matching {@link User} record with `role` and
   *   `role.permissions` preloaded.
   * @throws {RowNotFoundException} When no user exists with the given ID.
   */
  async detail(id: User['id']) {
    const user = await this.userRepository.findById(id)

    if (!user) {
      throw new RowNotFoundException(User)
    }

    await user.load('role', (query) => {
      query.preload('permissions')
    })

    return user
  }

  /**
   * Creates a new user via the invitation flow.
   *
   * Delegates entirely to {@link InvitationService.send}, which persists the
   * user without a password and dispatches the invite email.
   *
   * @param payload - Partial user data. Must include `email`.
   * @returns The newly created {@link User} record.
   * @throws {EmailAlreadyExistsException} When the email address is already
   *   taken.
   */
  async create(payload: Partial<User>) {
    return this.invitationService.send(payload)
  }

  /**
   * Updates a user's profile data.
   *
   * If the supplied `email` differs from the user's current address, the new
   * address is stored as `pendingEmail` and an `InitiateEmailChange` event is
   * dispatched to trigger a confirmation email. The `email` field itself is
   * excluded from the immediate update so the address change only takes effect
   * after the user confirms it.
   *
   * All other fields in `payload` are applied to the user record immediately.
   *
   * @param id - The ID of the user to update.
   * @param payload - Fields to update. `email` is handled separately (see
   *   above); all other keys are applied directly.
   * @returns The updated {@link User} record, or `null` if the repository
   *   returned nothing after the update.
   * @throws {RowNotFoundException} When no user exists with the given ID.
   */
  async update(id: User['id'], payload: Partial<User>): Promise<User | null> {
    let user = await this.userRepository.findById(id)

    if (!user) {
      throw new RowNotFoundException(User)
    }

    const { email, ...rest } = payload

    if (user.email !== email) {
      const tmp = await this.userRepository.update(user, {
        pendingEmail: email,
      })

      if (tmp) {
        await events.account.InitiateEmailChange.dispatch(tmp)
      }
    }

    user = await this.userRepository.update(user, rest)

    return user
  }

  /**
   * Permanently deletes a user account.
   *
   * @param id - The ID of the user to delete.
   * @returns The result of the repository delete operation.
   */
  async delete(id: User['id']) {
    return this.userRepository.delete(id)
  }
}
