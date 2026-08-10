import { BaseHttpException } from '#exceptions/base_http_exception'

export default class InvalidCredentialsException extends BaseHttpException {
  static status = 401
  static code = 'E_INVALID_CREDENTIALS'

  constructor() {
    super('Authentication failed. Please try again.')
  }
}
