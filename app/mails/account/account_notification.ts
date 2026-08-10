import { BaseNotification } from '#mails/base_notification'

export default class AccountNotification extends BaseNotification {
  get templatePath(): string {
    return 'emails/account_email'
  }
}
