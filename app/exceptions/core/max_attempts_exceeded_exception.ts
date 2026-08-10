import { BaseHttpException } from '#exceptions/base_http_exception'

export default class MaxAttemptsExceededException extends BaseHttpException {
  static status = 429
  static code = 'E_MAX_ATTEMPTS_EXCEEDED'

  constructor() {
    super('Maximum number of attempts exceeded. Please try again later.')
  }
}
