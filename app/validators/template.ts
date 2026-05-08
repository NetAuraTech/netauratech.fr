import vine from '@vinejs/vine'

const templateName = () => vine.string().trim().maxLength(255)
const templateDescription = () => vine.string().trim().maxLength(1000).nullable().optional()
const templateType = () => vine.enum(['page', 'block'] as const)
const locale = () => vine.string().trim().maxLength(10)

export const listTemplateValidator = vine.create({
  type: templateType().optional(),
  block_type: vine.string().trim().maxLength(50).optional(),
  search: vine.string().trim().maxLength(255).optional(),
})

export const showTemplateValidator = vine.create({
  id: vine.number().positive(),
})

export const createTemplateValidator = vine.create({
  name: templateName(),
  description: templateDescription(),
  thumbnailId: vine.number().positive().nullable().optional(),
  type: templateType(),
  blockType: vine.string().trim().maxLength(50).nullable().optional(),
  content: vine.any(),
})

export const updateTemplateValidator = vine.create({
  name: templateName().optional(),
  description: templateDescription(),
  thumbnailId: vine.number().positive().nullable().optional(),
  content: vine.any().optional(),
})

export const applyTemplateValidator = vine.create({
  pageId: vine.number().positive(),
  locale: locale(),
})

export const createFromPageValidator = vine.create({
  name: templateName(),
  pageId: vine.number().positive(),
  locale: locale(),
})
