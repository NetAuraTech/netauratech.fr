import factory from '@adonisjs/lucid/factories'
import Template from '#models/template/template'
import type { PageContent } from '#types/page'

const emptyContent: PageContent = { blocks: [] }

export const TemplateFactory = factory
  .define(Template, async ({ faker }) => {
    return {
      name: faker.lorem.words(3),
      description: null,
      thumbnailId: null,
      type: 'page' as const,
      blockType: null,
      content: emptyContent,
      createdBy: null,
    }
  })
  .build()
