import vine from '@vinejs/vine'
import type User from '#models/auth/user'
import { email, password } from '#validators/rules'

/**
 * Validator to use when performing self-register
 */
export const registerValidator = vine.create({
  email: email().unique({ table: 'users', column: 'email' }),
  password: password().confirmed({
    confirmationField: 'password_confirmation',
  }),
})

export const loginValidator = vine.create({
  email: email(),
  password: password(),
  remember_me: vine.boolean().optional(),
})

export const forgotPasswordValidator = vine.create({
  email: email(),
})

export const resetPasswordValidator = vine.create({
  token: vine.string(),
  password: password().confirmed({
    confirmationField: 'password_confirmation',
  }),
})

export const definePasswordValidator = vine.create({
  password: password().confirmed({
    confirmationField: 'password_confirmation',
  }),
})

export const invitationValidator = vine.create({
  token: vine.string(),
})

export const acceptInvitationValidator = (id?: User['id']) =>
  vine.create({
    email: email().unique(async (query, value) => {
      const user = await query.from('users').where('email', value).whereNot('id', id!).first()

      return !user
    }),
    username: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(255)
      .unique(async (query, value) => {
        const user = await query.from('users').where('username', value).whereNot('id', id!).first()

        return !user
      }),
    password: password().confirmed({
      confirmationField: 'password_confirmation',
    }),
  })
