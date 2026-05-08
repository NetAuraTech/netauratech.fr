import factory from '@adonisjs/lucid/factories'
import Page from '#models/page/page'
import PageTranslation from '#models/page/page_translation'
import PageRevision from '#models/page/page_revision'
import type { PageContent } from '#types/page'

const emptyContent: PageContent = { blocks: [] }

export const PageFactory = factory
  .define(Page, async () => {
    return {
      defaultLocale: 'en',
      metaImageId: null,
      createdBy: null,
    }
  })
  .relation('translations', () => PageTranslationFactory)
  .build()

export const PageTranslationFactory = factory
  .define(PageTranslation, async ({ faker }) => {
    return {
      pageId: 0, // overridden at call site
      locale: 'en',
      slug: `${faker.helpers.slugify(faker.lorem.words(3)).toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: faker.lorem.sentence(4),
      metaTitle: null,
      metaDescription: null,
      content: emptyContent,
      status: 'draft' as const,
      publishedAt: null,
    }
  })
  .build()

export const PageRevisionFactory = factory
  .define(PageRevision, async () => {
    return {
      pageTranslationId: 0, // overridden at call site
      content: emptyContent,
      keep: false,
      createdBy: null,
    }
  })
  .build()
