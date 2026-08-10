import { BaseHttpException } from '#exceptions/base_http_exception'

export default class ProviderNotConfiguredException extends BaseHttpException {
  static status = 501
  static code = 'E_PROVIDER_NOT_CONFIGURED'

  constructor(protected provider: string) {
    super(`${provider} authentication is not configured.`)
  }

  protected details() {
    return { provider: this.provider }
  }

  protected i18nParams() {
    return { provider: this.provider }
  }
}
