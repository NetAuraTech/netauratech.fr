import { BaseHttpException } from '#exceptions/base_http_exception'

export default class InvalidCurrentPasswordException extends BaseHttpException {
  static status = 400
  static code = 'E_INVALID_CURRENT_PASSWORD'

  constructor() {
    super('The current password is incorrect.')
  }
}
