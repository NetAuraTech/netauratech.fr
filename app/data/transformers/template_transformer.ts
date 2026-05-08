import { BaseTransformer } from '@adonisjs/core/transformers'
import type Template from '#models/template/template'

export default class TemplateTransformer extends BaseTransformer<Template> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'description', 'type', 'blockType', 'createdAt'])
  }
}
