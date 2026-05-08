import vine from '@vinejs/vine'

export const paginationValidator = vine.create({
  page: vine.number().min(1).optional(),
  perPage: vine.number().min(1).max(100).optional(),
})
