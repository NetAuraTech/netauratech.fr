import vine from '@vinejs/vine'
import type User from '#models/auth/user'
import { email, password } from '#validators/rules'

export const updateEmailValidator = (id: User['id']) =>
  vine.create({
    email: email().unique(async (query, value) => {
      const user = await query.from('users').where('email', value).whereNot('id', id!).first()

      return !user
    }),
  })

export const updatePasswordValidator = vine.create({
  current_password: password(),
  password: password().confirmed({
    confirmationField: 'password_confirmation',
  }),
})

export const deleteAccountValidator = vine.create({
  password: password(),
})

export const changeEmailValidator = vine.create({
  token: vine.string().trim().toLowerCase(),
})
