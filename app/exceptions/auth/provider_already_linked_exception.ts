import { BaseHttpException } from '#exceptions/base_http_exception'

export default class ProviderAlreadyLinkedException extends BaseHttpException {
  static status = 409
  static code = 'E_PROVIDER_ALREADY_LINKED'

  constructor(protected provider: string) {
    super(`The "${provider}" account is already linked to another user.`)
  }

  protected details() {
    return { provider: this.provider }
  }

  protected i18nParams() {
    return { provider: this.provider }
  }
}
