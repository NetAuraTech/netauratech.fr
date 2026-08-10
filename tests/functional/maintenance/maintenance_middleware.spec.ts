import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import redis from '@adonisjs/redis/services/main'
import { MaintenanceService } from '#services/maintenance/maintenance_service'

/**
 * Maintenance middleware integration tests.
 *
 * These run as HTTP requests through the full AdonisJS stack (routes →
 * maintenance route-group middleware → controllers), exercising exemption,
 * blocked-route, and response-format behaviour.
 */
test.group('Maintenance middleware', (group) => {
  group.each.setup(async () => {
    await redis.flushdb()
    const service = await app.container.make(MaintenanceService)
    await service.setConfig({ enabled: false })
  })

  test('maintenance OFF serves public pages normally', async ({ client }) => {
    const res = await client.get('/robots.txt')
    res.assertStatus(200)
  })

  test('maintenance ON blocks a public route with an HTML 503', async ({ client }) => {
    const service = await app.container.make(MaintenanceService)
    await service.setConfig({ enabled: true, message: 'Scheduled maintenance' })

    const res = await client.get('/robots.txt')
    res.assertStatus(503)
  })

  test('maintenance ON returns a JSON 503 for API/JSON requests', async ({ client, assert }) => {
    const service = await app.container.make(MaintenanceService)
    await service.setConfig({ enabled: true, message: 'Scheduled maintenance' })

    const res = await client.get('/robots.txt').accept('json')
    res.assertStatus(503)
    const body = res.body()
    assert.equal(body.error.code, 'E_MAINTENANCE')
    assert.equal(body.error.type, 'maintenance')
    assert.equal(body.error.message, 'Scheduled maintenance')
    assert.isNumber(body.error.retryAfter)
  })

  test('maintenance ON keeps /login accessible', async ({ client }) => {
    const service = await app.container.make(MaintenanceService)
    await service.setConfig({ enabled: true })

    const res = await client.get('/login')
    res.assertStatus(200)
  })

  test('maintenance ON keeps /health accessible', async ({ client }) => {
    const service = await app.container.make(MaintenanceService)
    await service.setConfig({ enabled: true })

    const res = await client.get('/health')
    res.assertStatus(200)
  })

  test('maintenance ON blocks /register', async ({ client }) => {
    const service = await app.container.make(MaintenanceService)
    await service.setConfig({ enabled: true })

    const res = await client.get('/register')
    res.assertStatus(503)
  })

  test('maintenance ON bypasses allowlisted clients', async ({ client }) => {
    const service = await app.container.make(MaintenanceService)
    await service.setConfig({ enabled: true, allowedIps: ['127.0.0.1/32', '::1/128'] })

    const res = await client.get('/robots.txt')
    res.assertStatus(200)
  })
})
