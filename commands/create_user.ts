import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { RegisterUserAction } from '#actions/auth/register_user_action'
import { type Locale } from '#types/preferences'
import { ListAllRolesAction } from '#actions/role/list_all_roles_action'
import { UpdateUserAction } from '#actions/user/update_user_action'

/**
 * Ace command that creates a new user account, then optionally sets a custom
 * username and role via {@link UpdateUserAction}.
 *
 * Flow:
 * 1. {@link RegisterUserAction} — creates the account with default role and generated username.
 * 2. {@link UpdateUserAction} — applies the chosen username and role if provided.
 *
 * @example
 * node ace create:user
 */
export default class CreateUser extends BaseCommand {
  static commandName = 'create:user'
  static description = 'Create a new user account'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
  }

  async run() {
    // App is already booted via startApp: true in command options
    const email = await this.prompt.ask('What is the user email?')
    const password = await this.prompt.secure('What is the user password?')

    const localeChoice: Locale = await this.prompt.choice('What is the user locale?', [
      { name: 'en', message: 'English' },
      { name: 'fr', message: 'French' },
    ])

    const username = await this.prompt.ask(
      'What is the user username? (leave blank to auto-generate)',
      {
        default: '',
      }
    )

    const listAllRolesAction = await this.app.container.make(ListAllRolesAction)
    const roles = await listAllRolesAction.execute()

    let roleId: number | undefined

    if (roles.length > 0) {
      const roleChoice = await this.prompt.choice('What is the user role?', [
        { name: 'none', message: 'No role (default)' },
        ...roles.map((role) => ({ name: String(role.id), message: role.name })),
      ])
      if (roleChoice !== 'none') {
        roleId = Number(roleChoice)
      }
    }

    const registerUserAction = await this.app.container.make(RegisterUserAction)
    const updateUserAction = await this.app.container.make(UpdateUserAction)

    try {
      const user = await registerUserAction.execute({
        email,
        password,
        locale: localeChoice,
      })

      const shouldUpdate = username.trim() !== '' || roleId !== undefined

      if (shouldUpdate) {
        await updateUserAction.execute({
          id: user.id,
          ...(username.trim() !== '' ? { username: username.trim() } : {}),
          ...(roleId !== undefined ? { roleId } : {}),
        })
      }

      this.logger.success(`User ${user.email} created successfully`)
    } catch (error) {
      this.logger.error(error.message)
      this.logger.debug(error.stack)
      this.exitCode = 1
    }
  }
}
