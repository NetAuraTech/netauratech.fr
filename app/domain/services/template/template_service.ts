import { inject } from '@adonisjs/core'
import { TemplateRepository } from '#repositories/template/template_repository'
import { PageTranslationRepository } from '#repositories/page/page_translation_repository'
import { LogService } from '#services/logging/log_service'
import type Template from '#models/template/template'
import type { BlockType, PageContent } from '#types/page'
import type { TemplateType } from '#types/template'

interface ListFilters {
  type?: TemplateType
  blockType?: BlockType
  search?: string
}

@inject()
export class TemplateService {
  constructor(
    protected templateRepository: TemplateRepository,
    protected translationRepository: PageTranslationRepository,
    protected logService: LogService
  ) {}

  /**
   * Returns all templates matching the given filters, ordered alphabetically by name.
   *
   * @param filters - Optional type, block type, and name search filters
   */
  async list(filters: ListFilters): Promise<Template[]> {
    return this.templateRepository.list(filters)
  }

  /**
   * Returns a single template with its thumbnail file preloaded.
   *
   * @param id - Template ID
   */
  async detail(id: number): Promise<Template> {
    return this.templateRepository.findByIdOrFail(id)
  }

  /**
   * Creates a new template.
   *
   * @param payload - Template data including type, content, and optional metadata
   * @param userId - ID of the authenticated user creating the template
   * @returns The newly created template record
   */
  async create(
    payload: {
      name: string
      description?: string | null
      thumbnailId?: number | null
      type: TemplateType
      blockType?: BlockType | null
      content: PageContent
    },
    userId: number
  ): Promise<Template> {
    const template = await this.templateRepository.create({ ...payload, createdBy: userId })

    this.logService.logBusiness(
      'template.created',
      { userId },
      {
        templateId: template.id,
        type: template.type,
        blockType: template.blockType,
      }
    )

    return template
  }

  /**
   * Updates a template's metadata or content.
   *
   * @param id - Template ID
   * @param payload - Fields to update — only provided fields are changed
   * @returns The updated template record
   */
  async update(
    id: number,
    payload: Partial<{
      name: string
      description: string | null
      thumbnailId: number | null
      content: PageContent
    }>
  ): Promise<Template> {
    const template = await this.templateRepository.findByIdOrFail(id)
    return this.templateRepository.update(template, payload)
  }

  /**
   * Permanently deletes a template.
   *
   * @param id - Template ID
   */
  async delete(id: number): Promise<void> {
    this.logService.logBusiness('template.deleted', {}, { templateId: id })
    return this.templateRepository.delete(id)
  }

  /**
   * Applies a page template to a translation by replacing its entire block tree.
   * Only works with `type = 'page'` templates. A revision of the current content
   * is saved before the replacement so the operation is reversible.
   *
   * @param templateId - Template ID (must be of type `'page'`)
   * @param pageId - Target page ID
   * @param locale - Target translation locale
   * @param userId - ID of the user applying the template
   * @throws {Error} When the template type is not `'page'`
   */
  async applyToPage(
    templateId: number,
    pageId: number,
    locale: string,
    userId: number
  ): Promise<void> {
    const template = await this.templateRepository.findByIdOrFail(templateId)

    if (template.type !== 'page') {
      throw Object.assign(new Error('Only page templates can be applied to a full page'), {
        code: 'E_INVALID_TEMPLATE_TYPE',
      })
    }

    const translation = await this.translationRepository.findByPageAndLocale(pageId, locale)

    if (!translation) {
      throw Object.assign(new Error(`No translation for locale "${locale}" on page ${pageId}`), {
        code: 'E_ROW_NOT_FOUND',
      })
    }

    await translation.saveRevision(userId)
    await this.translationRepository.update(translation, { content: template.content })

    this.logService.logBusiness('template.applied', { userId }, { templateId, pageId, locale })
  }

  /**
   * Saves the current content of a page translation as a new reusable template.
   * Useful for the "save as template" action in the page builder.
   *
   * @param name - Display name for the new template
   * @param pageId - Source page ID
   * @param locale - Source translation locale
   * @param userId - ID of the user creating the template
   * @returns The newly created template record
   * @throws {Error} When the source translation is not found
   */
  async createFromPage(
    name: string,
    pageId: number,
    locale: string,
    userId: number
  ): Promise<Template> {
    const translation = await this.translationRepository.findByPageAndLocale(pageId, locale)

    if (!translation) {
      throw Object.assign(new Error(`No translation for locale "${locale}" on page ${pageId}`), {
        code: 'E_ROW_NOT_FOUND',
      })
    }

    const template = await this.templateRepository.create({
      name,
      type: 'page',
      blockType: null,
      content: translation.content,
      createdBy: userId,
    })

    this.logService.logBusiness(
      'template.created_from_page',
      { userId },
      {
        templateId: template.id,
        pageId,
        locale,
      }
    )

    return template
  }
}
