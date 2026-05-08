import { test } from '@japa/runner'
import { MailService } from '#services/mails/mail_service'
import mail from '@adonisjs/mail/services/main'
import { BaseMail } from '@adonisjs/mail'

class DummyMail extends BaseMail {
  subject = 'Dummy Email'
  prepare() {
    this.message.to('dummy@example.com')
  }
}

test.group('MailService', () => {
  test('send() dispatches the mail payload using Adonis mail service', async () => {
    const service = new MailService()
    const { mails } = mail.fake()

    const payload = new DummyMail()
    await service.send(payload)

    mails.assertSent(DummyMail)

    mail.restore()
  })
})
