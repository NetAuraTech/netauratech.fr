import { BaseHttpException } from '#exceptions/base_http_exception'

export default class InvalidExtensionException extends BaseHttpException {
  static status = 422
  static code = 'E_INVALID_EXTENSION'

  constructor(protected ext: string) {
    super(`Extension ".${ext}" is not allowed.`)
  }

  protected details() {
    return { ext: this.ext }
  }

  protected i18nParams() {
    return { ext: this.ext }
  }
}
