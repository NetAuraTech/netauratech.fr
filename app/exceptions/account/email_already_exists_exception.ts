import { BaseHttpException } from '#exceptions/base_http_exception'

export default class EmailAlreadyExistsException extends BaseHttpException {
  static status = 409
  static code = 'E_EMAIL_EXISTS'

  constructor(protected email: string) {
    super('This email address is already in use by another account.')
  }

  protected details() {
    return { email: this.email }
  }
}
