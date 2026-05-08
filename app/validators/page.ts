import vine from '@vinejs/vine'

const slug = () =>
  vine
    .string()
    .trim()
    .toLowerCase()
    .maxLength(255)
    .regex(/^[a-z0-9-]+$/)
const locale = () => vine.string().trim().maxLength(10)
const title = () => vine.string().trim().maxLength(255)
const metaTitle = () => vine.string().trim().maxLength(255).nullable().optional()
const metaDescription = () => vine.string().trim().maxLength(500).nullable().optional()

export const listPageValidator = vine.create({
  page: vine.number().optional(),
  status: vine.enum(['draft', 'published', 'archived']).optional(),
  locale: locale().optional(),
  search: vine.string().trim().maxLength(255).optional(),
})

export const showPageValidator = vine.create({
  id: vine.number().positive(),
})

export const createPageValidator = vine.create({
  locale: locale(),
  metaImageId: vine.number().positive().nullable().optional(),
  slug: slug(),
  title: title(),
  content: vine.any().optional(),
  metaTitle: metaTitle(),
  metaDescription: metaDescription(),
})

export const updatePageValidator = vine.create({
  locale: locale(),
  slug: slug().optional(),
  title: title().optional(),
  content: vine.any().optional(),
  metaTitle: metaTitle(),
  metaDescription: metaDescription(),
  metaImageId: vine.number().positive().nullable().optional(),
})

export const publishPageValidator = vine.create({
  locale: locale(),
})

export const createTranslationValidator = vine.create({
  locale: locale(),
  slug: slug(),
  title: title(),
  metaTitle: metaTitle(),
  metaDescription: metaDescription(),
  seedFromLocale: locale().optional(),
})

export const revisionValidator = vine.create({
  translationId: vine.number().positive(),
  revisionId: vine.number().positive(),
})
