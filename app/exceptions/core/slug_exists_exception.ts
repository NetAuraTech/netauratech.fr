import { BaseHttpException } from '#exceptions/base_http_exception'

export default class SlugExistsException extends BaseHttpException {
  static status = 409
  static code = 'E_SLUG_EXISTS'

  constructor(protected slug: string) {
    super(`Slug "${slug}" is already taken.`)
  }

  protected details() {
    return { slug: this.slug }
  }

  protected i18nParams() {
    return { slug: this.slug }
  }
}
