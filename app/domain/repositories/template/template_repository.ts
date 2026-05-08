import Template from '#models/template/template'
import type { BlockType, PageContent } from '#types/page'
import type { TemplateType } from '#types/template'

interface ListFilters {
  type?: TemplateType
  blockType?: BlockType
  search?: string
}

export class TemplateRepository {
  async findById(id: number): Promise<Template | null> {
    return Template.query().where('id', id).preload('thumbnail').first()
  }

  async findByIdOrFail(id: number): Promise<Template> {
    return Template.query().where('id', id).preload('thumbnail').firstOrFail()
  }

  async list(filters: ListFilters): Promise<Template[]> {
    const query = Template.query().preload('thumbnail').orderBy('name', 'asc')

    if (filters.type) {
      query.where('type', filters.type)
    }

    if (filters.blockType) {
      query.where('block_type', filters.blockType)
    }

    if (filters.search) {
      query.whereILike('name', `%${filters.search}%`)
    }

    return query
  }

  async create(data: {
    name: string
    description?: string | null
    thumbnailId?: number | null
    type: TemplateType
    blockType?: BlockType | null
    content: PageContent
    createdBy: number | null
  }): Promise<Template> {
    return Template.create(data)
  }

  async update(
    template: Template,
    data: Partial<{
      name: string
      description: string | null
      thumbnailId: number | null
      content: PageContent
    }>
  ): Promise<Template> {
    template.merge(data)
    await template.save()
    return template
  }

  async delete(id: number): Promise<void> {
    const template = await Template.findOrFail(id)
    await template.delete()
  }
}
