import { BaseHttpException } from '#exceptions/base_http_exception'

export default class ForbiddenException extends BaseHttpException {
  static status = 403
  static code = 'E_FORBIDDEN'

  constructor() {
    super('You do not have permission to access this resource.')
  }
}
