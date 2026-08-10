import { test } from '@japa/runner'
import { BaseMail } from '@adonisjs/mail'
import type User from '#models/auth/user'
import { TOKEN_TYPES, type TokenType } from '#types/core'
import { type MailService } from '#services/mails/mail_service'
import { type GetPreferencesAction } from '#actions/preferences/get_preferences_action'
import { type TokenRepository } from '#repositories/core/token_repository'
import type i18nManager from '@adonisjs/i18n/services/main'

/* ------------------------------------------------------------------ */
/*  Doubles                                                            */
/* ------------------------------------------------------------------ */

class TestMail extends BaseMail {
  subject = 'Test Token Email'
  static lastPayload: Record<string, any> = {}

  constructor(payload: Record<string, any>) {
    super()
    Object.assign(this, payload)
    TestMail.lastPayload = payload
  }

  prepare() {
    this.message.to('test@example.com')
  }
}

class TestTokenListener extends BaseTokenListener {
  protected tokenType = TOKEN_TYPES.EMAIL_VERIFICATION
  protected expiresInHours = 24
  protected mailClass = TestMail

  constructor(
    mailService: MailService,
    getPreferencesAction: GetPreferencesAction,
    tokenRepository: TokenRepository
  ) {
    super(mailService, getPreferencesAction, tokenRepository)
  }

  protected buildMailPayload(_event: any, _locale: string, token: string): Record<string, any> {
    return { test_link: `https://test.com/link?token=${token}` }
  }

  protected getTranslationKeys(
    _event: any,
    i18n: ReturnType<typeof i18nManager.locale>
  ): Record<string, string> {
    return {
      subject: i18n.t('auth.verify_email.mail.subject'),
      greeting: i18n.t('auth.verify_email.mail.greeting'),
      intro: i18n.t('auth.verify_email.mail.intro'),
      action: i18n.t('auth.verify_email.mail.action'),
      outro: i18n.t('auth.verify_email.mail.outro'),
      expiry: i18n.t('auth.verify_email.mail.expiry', { hours: 24 }),
      footer: i18n.t('auth.verify_email.mail.footer'),
    }
  }
}

import { BaseTokenListener } from '#listeners/auth/base_token_listener'

/* ------------------------------------------------------------------ */
/*  Test group                                                         */
/* ------------------------------------------------------------------ */

test.group('BaseTokenListener', () => {
  test('handle() executes full 7-step flow', async ({ assert }) => {
    const fakeUser = { id: 1, email: 'test@example.com' } as User

    const createdToken = {} as {
      userId: number
      type: TokenType
      selector: string
      token: string
      expiresAt: Date
    }
    const mockTokenRepo = {
      expireTokensByType: async () => {},
      create: async (data: any) => {
        Object.assign(createdToken, data)
      },
    }

    let capturedPayload: any = null
    const mockMailService = {
      send: async (payload: any) => {
        capturedPayload = payload
      },
    }

    const mockPrefsAction = {
      execute: async () => ({ theme: 'light', locale: 'en' }),
    }

    const listener = new TestTokenListener(
      mockMailService as any,
      mockPrefsAction as any,
      mockTokenRepo as any
    )

    await listener.handle({ user: fakeUser })

    assert.equal(createdToken.userId, 1)
    assert.equal(createdToken.type, TOKEN_TYPES.EMAIL_VERIFICATION)
    assert.isTrue(createdToken.selector && createdToken.selector.length > 0)
    assert.isTrue(createdToken.token && createdToken.token.length > 0)
    assert.isTrue(createdToken.expiresAt > new Date())
    assert.ok(capturedPayload)
  })

  test('handle() expires existing tokens of the same type', async ({ assert }) => {
    let expiredType = null as any
    let expiredUser = null as any
    const mockTokenRepo = {
      expireTokensByType: async (user: any, type: any) => {
        expiredUser = user
        expiredType = type
      },
      create: async () => {},
    }

    const mockMailService = { send: async () => {} }
    const mockPrefsAction = {
      execute: async () => ({ theme: 'light', locale: 'en' }),
    }

    const fakeUser = { id: 2, email: 'user@test.com' } as User

    const listener = new TestTokenListener(
      mockMailService as any,
      mockPrefsAction as any,
      mockTokenRepo as any
    )

    await listener.handle({ user: fakeUser })

    assert.equal(expiredUser.id, 2)
    assert.equal(expiredType, TOKEN_TYPES.EMAIL_VERIFICATION)
  })

  test('handle() resolves user preferences for locale', async ({ assert }) => {
    let capturedUser = null as any
    const mockPrefsAction = {
      execute: async (payload: any) => {
        capturedUser = payload.user
        return { theme: 'dark', locale: 'fr' }
      },
    }

    class FrListener extends TestTokenListener {
      protected getTranslationKeys(
        _event: any,
        _i18n: ReturnType<typeof i18nManager.locale>
      ): Record<string, string> {
        return {
          subject: 'Sujet',
          greeting: 'Salut',
          intro: 'Intro',
          action: 'Action',
          outro: 'Outro',
          expiry: 'Expiré',
          footer: 'Pied',
        }
      }
    }

    const fakeUser = { id: 3, email: 'fr@test.com' } as User

    const listener = new FrListener(
      { send: async () => {} } as any,
      mockPrefsAction as any,
      { expireTokensByType: async () => {}, create: async () => {} } as any
    )

    await listener.handle({ user: fakeUser })

    assert.equal(capturedUser.id, 3)
  })

  test('handle() builds mail payload with user, translations, and extras', async ({ assert }) => {
    let capturedPayload: any = null
    const mockMailService = {
      send: async (payload: any) => {
        capturedPayload = payload
      },
    }

    const fakeUser = { id: 4, email: 'payload@test.com' } as User

    const listener = new TestTokenListener(
      mockMailService as any,
      { execute: async () => ({ theme: 'light', locale: 'en' }) } as any,
      { expireTokensByType: async () => {}, create: async () => {} } as any
    )

    await listener.handle({ user: fakeUser })

    assert.equal(capturedPayload.user.email, 'payload@test.com')
    assert.equal(capturedPayload.user.locale, 'en')
    assert.ok(capturedPayload.translations)
    assert.ok(capturedPayload.test_link)
    assert.include(capturedPayload.test_link, 'token=')
  })

  test('handle() sets correct token expiration time', async ({ assert }) => {
    const now = Date.now()
    let capturedExpiresAt: any = null
    const mockTokenRepo = {
      expireTokensByType: async () => {},
      create: async (data: any) => {
        capturedExpiresAt = data.expiresAt
      },
    }

    const fakeUser = { id: 5, email: 'expiry@test.com' } as User

    const listener = new TestTokenListener(
      { send: async () => {} } as any,
      { execute: async () => ({ theme: 'light', locale: 'en' }) } as any,
      mockTokenRepo as any
    )

    await listener.handle({ user: fakeUser })

    // expiresAt is a Luxon DateTime ~24h from now
    const ms = capturedExpiresAt.toJSDate().getTime()
    const diffHours = (ms - now) / 1000 / 3600
    assert.isTrue(diffHours >= 23.5 && diffHours <= 24.5, `expected ~24h, got ${diffHours}`)
  })

  test('handle() generates a split token (selector.validator) in the mail link', async ({
    assert,
  }) => {
    let capturedPayload: any = null
    const mockMailService = {
      send: async (payload: any) => {
        capturedPayload = payload
      },
    }

    const fakeUser = { id: 6, email: 'split@test.com' } as User

    const listener = new TestTokenListener(
      mockMailService as any,
      { execute: async () => ({ theme: 'light', locale: 'en' }) } as any,
      { expireTokensByType: async () => {}, create: async () => {} } as any
    )

    await listener.handle({ user: fakeUser })

    // Extract token from link: https://test.com/link?token=SELECTOR.VALIDATOR
    const url = new URL(capturedPayload.test_link)
    const token = url.searchParams.get('token')
    assert.ok(token)
    const parts = token!.split('.')
    assert.equal(parts.length, 2)
    assert.isTrue(parts[0]!.length > 0, 'selector should not be empty')
    assert.isTrue(parts[1]!.length > 0, 'validator should not be empty')
  })
})
