import { BaseHttpException } from '#exceptions/base_http_exception'

export default class UnverifiedAccountException extends BaseHttpException {
  static status = 403
  static code = 'E_UNVERIFIED_ACCOUNT'

  constructor(protected email: string) {
    super(
      'This account has not yet been verified. Please verify your email address before continuing.'
    )
  }

  protected details() {
    return { email: this.email }
  }
}
