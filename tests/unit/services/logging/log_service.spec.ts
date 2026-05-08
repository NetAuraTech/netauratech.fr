import { test } from '@japa/runner'
import { LogService } from '#services/logging/log_service'
import { LogLevel } from '#types/logging'
import { type HttpContext } from '@adonisjs/core/http'
import { HttpContextFactory } from '@adonisjs/core/factories/http'

test.group('LogService', () => {
  test('basic log levels do not throw', async ({ assert }) => {
    const service = new LogService()

    assert.doesNotThrow(() => {
      service.debug({ message: 'test debug' })
      service.info({ message: 'test info' })
      service.warn({ message: 'test warn' })
      service.error({ message: 'test error', error: new Error('test') })
      service.fatal({ message: 'test fatal', error: new Error('test') })
    })
  })

  test('domain loggers do not throw', async ({ assert }) => {
    const service = new LogService()

    assert.doesNotThrow(() => {
      service.logAuth('test.action', { userId: 1 })
      service.logSecurity('test.security', { userId: 1 })
      service.logSecurity('test.security.warn', { userId: 1 }, LogLevel.WARN)
      service.logQuery('SELECT 1', 50)
      service.logQuery('SELECT 1', 1500) // Triggers WARN
      service.logPerformance('test.perf', 100)
      service.logPerformance('test.perf.slow', 6000) // Triggers WARN
      service.logBusiness('test.business', { userId: 1 }, { extra: true })
    })
  })

  test('extractContext creates LogContext from HttpContext', async ({ assert }) => {
    const service = new LogService()
    const ctx = new HttpContextFactory().create()

    ctx.request.method = () => 'POST'
    ctx.request.url = () => '/api/test'
    ctx.request.header = (key) => (key === 'user-agent' ? 'test-agent' : undefined)
    ctx.request.ip = () => '127.0.0.1'

    const context = service.extractContext(ctx as unknown as HttpContext)

    assert.equal(context.method, 'POST')
    assert.equal(context.url, '/api/test')
    assert.equal(context.userAgent, 'test-agent')
  })

  test('logApiRequest does not throw', async ({ assert }) => {
    const service = new LogService()
    const ctx = new HttpContextFactory().create()

    assert.doesNotThrow(() => {
      service.logApiRequest(ctx as unknown as HttpContext, 120)
    })
  })
})
