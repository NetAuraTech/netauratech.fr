import factory from '@adonisjs/lucid/factories'
import User from '#models/auth/user'
import Role from '#models/auth/role'
import { DateTime } from 'luxon'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      username: faker.internet.username(),
      email: faker.internet.email().toLowerCase(),
      password: 'Password123!',
      emailVerifiedAt: DateTime.now(),
    } as unknown as Partial<User>
  })
  .relation('role', () => RoleFactory)
  .build()

export const RoleFactory = factory
  .define(Role, async ({ faker }) => {
    return {
      name: faker.word.noun(),
      slug: faker.helpers.slugify(faker.word.noun()).toLowerCase(),
      isSystem: false,
    }
  })
  .build()
