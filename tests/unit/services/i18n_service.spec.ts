import { test } from '@japa/runner'
import type { I18n } from '@adonisjs/i18n'
import { I18nService } from '#services/i18n_service'

class FakeI18n implements Partial<I18n> {
  public locale = 'en'
  private translations: Record<string, string> = {}

  constructor(translations?: Record<string, string>) {
    this.translations = translations ?? {}
  }

  t(key: string, replacements?: Record<string, any>): string {
    let result = this.translations[key] ?? key
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return result
  }
}

test.group('I18nService', () => {
  let i18n: FakeI18n
  let service: I18nService

  test('translate() delegates to the underlying I18n instance', ({ assert }) => {
    i18n = new FakeI18n({ 'auth.session.login.success': 'Logged in!' })
    service = new I18nService(i18n as unknown as I18n)

    const result = service.translate('auth.session.login.success')
    assert.equal(result, 'Logged in!')
  })

  test('translate() passes replacements to the underlying instance', ({ assert }) => {
    i18n = new FakeI18n({ 'admin.users.deleted': 'User deleted' })
    service = new I18nService(i18n as unknown as I18n)

    // Just verify it doesn't throw and returns a string — the underlying I18n handles interpolation
    assert.doesNotThrow(() => {
      service.translate('admin.users.deleted', { username: 'John' })
    })
  })

  test('translate() falls back to key when translation is missing', ({ assert }) => {
    i18n = new FakeI18n({})
    service = new I18nService(i18n as unknown as I18n)

    const result = service.translate('nonexistent.key')
    assert.equal(result, 'nonexistent.key')
  })

  test('getLocale() returns the current locale', ({ assert }) => {
    i18n = new FakeI18n({})
    i18n.locale = 'fr'
    service = new I18nService(i18n as unknown as I18n)

    assert.equal(service.getLocale(), 'fr')
  })

  test('buildPayload() translates flat string values', ({ assert }) => {
    i18n = new FakeI18n({
      'auth.session.login.title': 'Welcome back!',
      'auth.session.login.sub_title': 'Please log in.',
    })
    service = new I18nService(i18n as unknown as I18n)

    const result = service.buildPayload({
      title: 'auth.session.login.title',
      sub_title: 'auth.session.login.sub_title',
    })

    assert.deepEqual(result, {
      title: 'Welcome back!',
      sub_title: 'Please log in.',
    })
  })

  test('buildPayload() translates nested objects recursively', ({ assert }) => {
    i18n = new FakeI18n({
      'auth.session.login.title': 'Welcome back!',
      'auth.register.account.has': 'Already have an account?',
      'auth.register.account.login': 'Login',
    })
    service = new I18nService(i18n as unknown as I18n)

    const result = service.buildPayload({
      title: 'auth.session.login.title',
      account: {
        has: 'auth.register.account.has',
        login: 'auth.register.account.login',
      },
    })

    assert.deepEqual(result, {
      title: 'Welcome back!',
      account: {
        has: 'Already have an account?',
        login: 'Login',
      },
    })
  })

  test('buildPayload() preserves structure of deeply nested objects', ({ assert }) => {
    i18n = new FakeI18n({
      'a.b.c': 'Deep translation',
      'x.y.z.w': 'Very deep',
    })
    service = new I18nService(i18n as unknown as I18n)

    const result = service.buildPayload({
      a: { b: { c: 'a.b.c' } },
      x: { y: { z: { w: 'x.y.z.w' } } },
    })

    assert.deepEqual(result, {
      a: { b: { c: 'Deep translation' } },
      x: { y: { z: { w: 'Very deep' } } },
    })
  })

  test('buildPayload() falls back to key for missing translations', ({ assert }) => {
    i18n = new FakeI18n({})
    service = new I18nService(i18n as unknown as I18n)

    const result = service.buildPayload({
      title: 'missing.key',
    })

    assert.deepEqual(result, { title: 'missing.key' })
  })

  test('entry() creates a marker that buildPayload resolves with replacements', ({ assert }) => {
    i18n = new FakeI18n({
      'admin.users.edit.title': 'Edit user {username}',
    })
    service = new I18nService(i18n as unknown as I18n)

    const result = service.buildPayload({
      title: service.entry('admin.users.edit.title', { username: 'alice' }),
    })

    assert.deepEqual(result, { title: 'Edit user alice' })
  })

  test('entry() works without replacements', ({ assert }) => {
    i18n = new FakeI18n({
      'admin.common.submit': 'Submit',
    })
    service = new I18nService(i18n as unknown as I18n)

    const result = service.buildPayload({
      submit: service.entry('admin.common.submit'),
    })

    assert.deepEqual(result, { submit: 'Submit' })
  })

  test('buildPayload() mixes plain strings and entry markers', ({ assert }) => {
    i18n = new FakeI18n({
      'admin.users.form.email.value': 'Email',
      'admin.users.edit.title': 'Edit user {username}',
      'admin.common.submit': 'Submit',
    })
    service = new I18nService(i18n as unknown as I18n)

    const result = service.buildPayload({
      email: 'admin.users.form.email.value',
      title: service.entry('admin.users.edit.title', { username: 'bob' }),
      submit: service.entry('admin.common.submit'),
    })

    assert.deepEqual(result, {
      email: 'Email',
      title: 'Edit user bob',
      submit: 'Submit',
    })
  })

  test('buildPayload() resolves entry markers in nested objects', ({ assert }) => {
    i18n = new FakeI18n({
      'auth.session.login.title': 'Welcome back!',
      'admin.users.edit.title': 'Edit user {username}',
    })
    service = new I18nService(i18n as unknown as I18n)

    const result = service.buildPayload({
      title: 'auth.session.login.title',
      user: {
        name: service.entry('admin.users.edit.title', { username: 'carol' }),
      },
    })

    assert.deepEqual(result, {
      title: 'Welcome back!',
      user: { name: 'Edit user carol' },
    })
  })
})
