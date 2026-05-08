import vine from '@vinejs/vine'
import type User from '#models/auth/user'

const email = () => vine.string().trim().toLowerCase().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

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
