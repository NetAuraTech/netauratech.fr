import { BaseTransformer } from '@adonisjs/core/transformers'
import type PageRevision from '#models/page/page_revision'
export default class PageRevisionTransformer extends BaseTransformer<PageRevision> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'keep', 'createdAt']),
      created_by: this.resource.author
        ? {
            id: this.resource.author.id,
            username: this.resource.author.username,
          }
        : null,
    }
  }
}
