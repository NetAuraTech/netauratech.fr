import vine from '@vinejs/vine'

const fieldValue = () => vine.string().trim().maxLength(2000)

export const contactValidator = vine.create(vine.record(fieldValue()))
