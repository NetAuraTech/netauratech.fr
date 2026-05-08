import { test } from '@japa/runner'
import { HttpContextFactory } from '@adonisjs/core/factories/http'
import EmailAlreadyExistsException from '#exceptions/account/email_already_exists_exception'
import ForbiddenException from '#exceptions/auth/forbidden_exception'
import InvalidCredentialsException from '#exceptions/auth/invalid_credentials_exception'
import InvalidCurrentPasswordException from '#exceptions/auth/invalid_current_password_exception'
import ProviderAlreadyLinkedException from '#exceptions/auth/provider_already_linked_exception'
import ProviderNotConfiguredException from '#exceptions/auth/provider_not_configured_exception'
import UnauthorizedException from '#exceptions/auth/unauthorized_exception'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'
import MaxAttemptsExceededException from '#exceptions/core/max_attempts_exceeded_exception'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'
import SlugExistsException from '#exceptions/core/slug_exists_exception'
import FileTooLargeException from '#exceptions/file/file_too_large_exception'
import InvalidExtensionException from '#exceptions/file/invalid_extension_exception'
import MissingTranslationException from '#exceptions/page/missing_translation_exception'

async function testExceptionHandle(error: any, assert: any) {
  // --- JSON Request Simulation ---
  const ctxJson = new HttpContextFactory().create()
  ctxJson.request.wantsJSON = () => true
  ctxJson.i18n = { t: () => 'translated message' } as any

  let jsonResponse: any = null
  let jsonStatus: number | null = null
  ctxJson.response.status = function (this: any, s: number) {
    jsonStatus = s
    return this
  } as any
  ctxJson.response.send = function (this: any, body: any) {
    jsonResponse = body
    return this
  } as any

  await error.handle(error, ctxJson)

  assert.equal(jsonStatus, error.status)
  assert.equal(jsonResponse.error.code, error.code)
  assert.equal(jsonResponse.error.message, 'translated message')

  // --- HTML Request Simulation ---
  const ctxHtml = new HttpContextFactory().create()
  ctxHtml.request.wantsJSON = () => false
  ctxHtml.i18n = { t: () => 'translated message' } as any

  let flashedKey: string | null = null
  let flashedValue: any = null
  ctxHtml.session = {
    flash: (key: string, val: any) => {
      flashedKey = key
      flashedValue = val
    },
  } as any

  let redirectedBack = false
  let redirectedRoute: string | null = null
  ctxHtml.response.redirect = function (this: any) {
    return {
      back: () => {
        redirectedBack = true
      },
      toRoute: (route: string) => {
        redirectedRoute = route
      },
    }
  } as any

  await error.handle(error, ctxHtml)

  assert.equal(flashedKey, 'error')
  assert.equal(flashedValue, 'translated message')
  assert.isTrue(redirectedBack || redirectedRoute !== null)
}

test.group('Exceptions', () => {
  test('EmailAlreadyExistsException properties and handle()', async ({ assert }) => {
    const error = new EmailAlreadyExistsException('test@example.com')
    assert.equal(error.status, 409)
    assert.equal(error.code, 'E_EMAIL_EXISTS')
    await testExceptionHandle(error, assert)
  })

  test('ForbiddenException properties and handle()', async ({ assert }) => {
    const error = new ForbiddenException()
    assert.equal(error.status, 403)
    assert.equal(error.code, 'E_FORBIDDEN')
    await testExceptionHandle(error, assert)
  })

  test('InvalidCredentialsException properties and handle()', async ({ assert }) => {
    const error = new InvalidCredentialsException()
    assert.equal(error.status, 401)
    assert.equal(error.code, 'E_INVALID_CREDENTIALS')
    await testExceptionHandle(error, assert)
  })

  test('InvalidCurrentPasswordException properties and handle()', async ({ assert }) => {
    const error = new InvalidCurrentPasswordException()
    assert.equal(error.status, 400)
    assert.equal(error.code, 'E_INVALID_CURRENT_PASSWORD')
    await testExceptionHandle(error, assert)
  })

  test('ProviderAlreadyLinkedException properties and handle()', async ({ assert }) => {
    const error = new ProviderAlreadyLinkedException('google')
    assert.equal(error.status, 409)
    assert.equal(error.code, 'E_PROVIDER_ALREADY_LINKED')
    await testExceptionHandle(error, assert)
  })

  test('ProviderNotConfiguredException properties and handle()', async ({ assert }) => {
    const error = new ProviderNotConfiguredException('google')
    assert.equal(error.status, 501)
    assert.equal(error.code, 'E_PROVIDER_NOT_CONFIGURED')
    await testExceptionHandle(error, assert)
  })

  test('UnauthorizedException properties and handle()', async ({ assert }) => {
    const error = new UnauthorizedException()
    assert.equal(error.status, 401)
    assert.equal(error.code, 'E_UNAUTHORIZED')
    await testExceptionHandle(error, assert)
  })

  test('UnverifiedAccountException properties and handle()', async ({ assert }) => {
    const error = new UnverifiedAccountException('test@example.com')
    assert.equal(error.status, 403)
    assert.equal(error.code, 'E_UNVERIFIED_ACCOUNT')
    await testExceptionHandle(error, assert)
  })

  test('InvalidTokenException properties and handle()', async ({ assert }) => {
    const error = new InvalidTokenException()
    assert.equal(error.status, 400)
    assert.equal(error.code, 'E_INVALID_TOKEN')
    await testExceptionHandle(error, assert)
  })

  test('MaxAttemptsExceededException properties and handle()', async ({ assert }) => {
    const error = new MaxAttemptsExceededException()
    assert.equal(error.status, 429)
    assert.equal(error.code, 'E_MAX_ATTEMPTS_EXCEEDED')
    await testExceptionHandle(error, assert)
  })

  test('RowNotFoundException properties and handle()', async ({ assert }) => {
    const error = new RowNotFoundException()
    assert.equal(error.status, 404)
    assert.equal(error.code, 'E_ROW_NOT_FOUND')
    await testExceptionHandle(error, assert)
  })

  test('SlugExistsException properties and handle()', async ({ assert }) => {
    const error = new SlugExistsException('slug-test')
    assert.equal(error.status, 409)
    assert.equal(error.code, 'E_SLUG_EXISTS')
    await testExceptionHandle(error, assert)
  })

  test('FileTooLargeException properties and handle()', async ({ assert }) => {
    const error = new FileTooLargeException(10)
    assert.equal(error.status, 413)
    assert.equal(error.code, 'E_FILE_TOO_LARGE')
    await testExceptionHandle(error, assert)
  })

  test('InvalidExtensionException properties and handle()', async ({ assert }) => {
    const error = new InvalidExtensionException('exe')
    assert.equal(error.status, 422)
    assert.equal(error.code, 'E_INVALID_EXTENSION')
    await testExceptionHandle(error, assert)
  })

  test('MissingTranslationException properties and handle()', async ({ assert }) => {
    const error = new MissingTranslationException('fr', 1)
    assert.equal(error.status, 404)
    assert.equal(error.code, 'E_MISSING_TRANSLATION')
    await testExceptionHandle(error, assert)
  })
})
