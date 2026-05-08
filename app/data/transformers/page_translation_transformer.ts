import { BaseTransformer } from '@adonisjs/core/transformers'
import type PageTranslation from '#models/page/page_translation'

export default class PageTranslationTransformer extends BaseTransformer<PageTranslation> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'pageId',
      'locale',
      'slug',
      'title',
      'status',
      'metaTitle',
      'metaDescription',
      'content',
      'resolved_content',
      'updatedAt',
    ])
  }
}
