import vine from '@vinejs/vine'
import type User from '#models/auth/user'

export const profileValidator = (id: User['id']) =>
  vine.create({
    username: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(255)
      .unique(async (query, value) => {
        const user = await query.from('users').where('username', value).whereNot('id', id!).first()

        return !user
      }),
  })
