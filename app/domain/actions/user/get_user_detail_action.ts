import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'
import { UserRepository } from '#repositories/auth/user_repository'

interface GetUserDetailPayload {
  id: number
}

/**
 * Retrieve a single user by primary key, preloading role with permissions.
 */
@inject()
export class GetUserDetailAction {
  constructor(protected userRepository: UserRepository) {}

  /**
   * Execute user detail lookup.
   *
   * @param payload - The user ID to retrieve.
   * @returns The {@link User} with role and permissions preloaded.
   * @throws {RowNotFoundException} When no record exists for the given id.
   *
   * @example
   * const user = await getUserDetailAction.execute({ id: 1 })
   */
  async execute(payload: GetUserDetailPayload): Promise<User> {
    const user = await this.userRepository.findById(payload.id)

    if (!user) {
      throw new RowNotFoundException(User)
    }

    await user.load('role', (query) => {
      query.preload('permissions')
    })

    return user
  }
}
