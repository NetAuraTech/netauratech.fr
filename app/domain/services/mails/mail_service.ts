import { type BaseMail } from '@adonisjs/mail'
import mail from '@adonisjs/mail/services/main'

/**
 * Thin wrapper around the AdonisJS mail service.
 *
 * Centralises all outgoing email dispatch so that the underlying mail
 * driver can be swapped or mocked in tests without touching call sites.
 */
export class MailService {
  /**
   * Sends a mail using the AdonisJS mail service.
   *
   * The `payload` should be an instance of a class extending
   * {@link BaseMail}, which encapsulates the recipient, subject,
   * template, and any additional data needed to render the email.
   *
   * @param payload - The mail instance to send.
   * @throws {Error} If the underlying mail driver fails to deliver the message.
   *
   * @example
   * await mailService.send(new ResetPasswordMail(user, token))
   */
  async send(payload: BaseMail): Promise<void> {
    await mail.send(payload)
  }
}
