import { BaseNotification } from '#mails/base_notification'

export default class AuthNotification extends BaseNotification {
  get templatePath(): string {
    return 'emails/auth_email'
  }
}
