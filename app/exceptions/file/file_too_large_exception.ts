import env from '#start/env'
import { BaseHttpException } from '#exceptions/base_http_exception'

export default class FileTooLargeException extends BaseHttpException {
  static status = 413
  static code = 'E_FILE_TOO_LARGE'

  constructor(protected limit: number = env.get('MAX_UPLOAD_SIZE', 10)) {
    super(`File exceeds the ${limit}MB limit.`)
  }

  protected details() {
    return { limit: this.limit }
  }

  protected i18nParams() {
    return { limit: this.limit }
  }
}
