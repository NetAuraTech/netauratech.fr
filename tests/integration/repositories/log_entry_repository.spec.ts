import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import LogEntry from '#models/core/log_entry'
import { LogEntryRepository } from '#repositories/logging/log_entry_repository'
import { UserFactory } from '#database/factories/user_factory'
import { LogCategory, LogLevel, type CreateLogEntryInput } from '#types/logging'

test.group('LogEntryRepository', (group) => {
  const repo = new LogEntryRepository()

  group.each.setup(async () => {
    await LogEntry.query().delete()
  })

  const createEntry = (overrides: Partial<CreateLogEntryInput> = {}) =>
    repo.createRecord({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: 'test entry',
      ...overrides,
    })

  /**
   * Backdate a row's `created_at` directly at the knex level — Lucid's
   * `autoCreate` timestamp cannot be set through the model.
   */
  const backdate = async (id: number, createdAt: DateTime) => {
    await db.from('log_entries').where('id', id).update({ created_at: createdAt.toSQL() })
  }

  test('createRecord persists all fields', async ({ assert }) => {
    const actor = await UserFactory.create()
    const entry = await createEntry({
      level: LogLevel.ERROR,
      category: LogCategory.BUSINESS,
      message: 'Business Event: page.published',
      actorId: actor.id,
      actorEmail: 'admin@example.com',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      requestId: 'req-123',
      context: { pageId: 42 },
      error: { name: 'Error', message: 'boom' },
    })

    const fresh = await LogEntry.findOrFail(entry.id)
    assert.equal(fresh.level, LogLevel.ERROR)
    assert.equal(fresh.category, LogCategory.BUSINESS)
    assert.equal(fresh.message, 'Business Event: page.published')
    assert.equal(fresh.actorId, actor.id)
    assert.equal(fresh.actorEmail, 'admin@example.com')
    assert.equal(fresh.ip, '127.0.0.1')
    assert.equal(fresh.userAgent, 'test-agent')
    assert.equal(fresh.requestId, 'req-123')
    assert.deepEqual(fresh.context, { pageId: 42 })
    assert.deepEqual(fresh.error, { name: 'Error', message: 'boom' })
    assert.isNotNull(fresh.createdAt)
  })

  test('createRecord defaults optional fields to null', async ({ assert }) => {
    const entry = await createEntry()

    assert.isNull(entry.actorId)
    assert.isNull(entry.actorEmail)
    assert.isNull(entry.ip)
    assert.isNull(entry.userAgent)
    assert.isNull(entry.requestId)
    assert.isNull(entry.context)
    assert.isNull(entry.error)
  })

  test('listPaginated returns entries newest first with pagination meta', async ({ assert }) => {
    const marker = `list_${Date.now()}`
    const oldest = await createEntry({ message: `${marker} oldest` })
    const newest = await createEntry({ message: `${marker} newest` })
    await backdate(oldest.id, DateTime.now().minus({ hours: 2 }))

    const result = await repo.listPaginated({ search: marker, page: 1, perPage: 10 })

    assert.lengthOf(result.all(), 2)
    assert.equal(result.all()[0].id, newest.id)
    assert.equal(result.all()[1].id, oldest.id)
    assert.equal(result.getMeta().total, 2)
  })

  test('listPaginated paginates results', async ({ assert }) => {
    const marker = `paginate_${Date.now()}`
    for (let i = 0; i < 5; i++) {
      await createEntry({ message: `${marker} ${i}` })
    }

    const page1 = await repo.listPaginated({ search: marker, page: 1, perPage: 2 })
    const page3 = await repo.listPaginated({ search: marker, page: 3, perPage: 2 })

    assert.lengthOf(page1.all(), 2)
    assert.equal(page1.getMeta().total, 5)
    assert.equal(page1.getMeta().lastPage, 3)
    assert.lengthOf(page3.all(), 1)
  })

  test('listPaginated filters by level and category', async ({ assert }) => {
    await createEntry({ level: LogLevel.ERROR, category: LogCategory.SECURITY })
    await createEntry({ level: LogLevel.INFO, category: LogCategory.BUSINESS })

    const errors = await repo.listPaginated({ level: LogLevel.ERROR })
    assert.isTrue(errors.all().length >= 1)
    assert.isTrue(errors.all().every((entry) => entry.level === LogLevel.ERROR))

    const business = await repo.listPaginated({ category: LogCategory.BUSINESS })
    assert.isTrue(business.all().length >= 1)
    assert.isTrue(business.all().every((entry) => entry.category === LogCategory.BUSINESS))
  })

  test('listPaginated search is case-insensitive', async ({ assert }) => {
    const marker = `SearchMarker_${Date.now()}`
    await createEntry({ message: `Business Event: ${marker}` })

    const result = await repo.listPaginated({ search: marker.toLowerCase() })

    assert.lengthOf(result.all(), 1)
    assert.include(result.all()[0].message, marker)
  })

  test('listPaginated filters by actor and date range', async ({ assert }) => {
    const actor = await UserFactory.create()
    const recent = await createEntry({ actorId: actor.id })
    const old = await createEntry({ actorId: actor.id })
    await backdate(old.id, DateTime.now().minus({ days: 10 }))

    const byActor = await repo.listPaginated({ actorId: actor.id })
    assert.isTrue(byActor.all().length >= 2)

    const fromDate = await repo.listPaginated({
      actorId: actor.id,
      from: DateTime.now().minus({ days: 1 }),
    })
    assert.lengthOf(fromDate.all(), 1)
    assert.equal(fromDate.all()[0].id, recent.id)

    const toDate = await repo.listPaginated({
      actorId: actor.id,
      to: DateTime.now().minus({ days: 1 }),
    })
    assert.lengthOf(toDate.all(), 1)
    assert.equal(toDate.all()[0].id, old.id)
  })

  test('countOlderThan and deleteOlderThan prune by date', async ({ assert }) => {
    const marker = `prune_${Date.now()}`
    const old = await createEntry({ message: `${marker} old` })
    const recent = await createEntry({ message: `${marker} recent` })
    await backdate(old.id, DateTime.now().minus({ days: 30 }))

    const cutoff = DateTime.now().minus({ days: 7 })

    const counted = await repo.countOlderThan(cutoff)
    assert.isTrue(counted >= 1)

    const deleted = await repo.deleteOlderThan(cutoff)
    assert.isTrue(deleted >= 1)

    assert.isNull(await LogEntry.find(old.id))
    assert.isNotNull(await LogEntry.find(recent.id))
  })

  test('countBeyondNewest and deleteOldestBeyond enforce a row cap', async ({ assert }) => {
    const marker = `cap_${Date.now()}`
    const ids: number[] = []
    for (let i = 0; i < 5; i++) {
      const entry = await createEntry({ message: `${marker} ${i}` })
      await backdate(entry.id, DateTime.now().minus({ hours: 5 - i }))
      ids.push(entry.id)
    }

    // 5 rows of this marker exist; other suites may add unrelated rows, so
    // only assert relative behavior below.
    const excess = await repo.countBeyondNewest(2)
    assert.isTrue(excess >= 3)

    await repo.deleteOldestBeyond(2)

    const remaining = await repo.listPaginated({ search: marker, perPage: 100 })
    assert.lengthOf(remaining.all(), 2)
    // The two newest entries of the marker set survive.
    assert.deepEqual(
      remaining
        .all()
        .map((entry) => entry.id)
        .sort(),
      [ids[3], ids[4]].sort()
    )
  })
})
