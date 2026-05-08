import { BaseTransformer } from '@adonisjs/core/transformers'
import type Page from '#models/page/page'
import PageTranslationTransformer from '#transformers/page_translation_transformer'

export default class PageTransformer extends BaseTransformer<Page> {
  async toObject() {
    const translations = await Promise.all(
      this.resource.translations.map((translation) =>
        new PageTranslationTransformer(translation).toObject()
      )
    )

    return {
      ...this.pick(this.resource, ['id', 'defaultLocale', 'isHomepage', 'createdAt', 'updatedAt']),
      translations,
    }
  }
}
