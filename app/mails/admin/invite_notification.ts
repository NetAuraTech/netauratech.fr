import { BaseNotification } from '#mails/base_notification'

export default class InviteNotification extends BaseNotification {
  get templatePath(): string {
    return 'emails/admin_invite_email'
  }
}
