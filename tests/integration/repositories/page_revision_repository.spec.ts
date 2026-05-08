import { test } from '@japa/runner'
import { PageRevisionRepository } from '#repositories/page/page_revision_repository'
import { PageFactory, PageTranslationFactory, PageRevisionFactory } from '#factories/page_factory'
import type { PageContent } from '#types/page'

/**
 * Integration tests for `PageRevisionRepository`.
 */
test.group('PageRevisionRepository', () => {
  const repo = new PageRevisionRepository()
  const emptyContent: PageContent = { blocks: [] }

  async function makeTranslation() {
    const page = await PageFactory.create()
    return PageTranslationFactory.merge({ pageId: page.id, slug: `slug-${Date.now()}` }).create()
  }

  // ─── create() ─────────────────────────────────────────────────────────────

  test('create() inserts a revision snapshot', async ({ assert }) => {
    const translation = await makeTranslation()

    const revision = await repo.create({
      pageTranslationId: translation.id,
      content: emptyContent,
      keep: false,
      createdBy: null,
    })

    assert.isNumber(revision.id)
    assert.equal(revision.pageTranslationId, translation.id)
    assert.isFalse(revision.keep)
  })

  // ─── listByTranslation() ──────────────────────────────────────────────────

  test('listByTranslation() orders by created_at descending', async ({ assert }) => {
    const translation = await makeTranslation()

    const r1 = await PageRevisionFactory.merge({ pageTranslationId: translation.id }).create()
    const r2 = await PageRevisionFactory.merge({ pageTranslationId: translation.id }).create()
    const r3 = await PageRevisionFactory.merge({ pageTranslationId: translation.id }).create()

    const revisions = await repo.listByTranslation(translation.id)
    const ids = revisions.map((r) => r.id)

    // Most recent should be first — IDs increase with time in tests
    assert.equal(ids[0], r3.id)
    assert.equal(ids[1], r2.id)
    assert.equal(ids[2], r1.id)
  })

  test('listByTranslation() respects the limit parameter', async ({ assert }) => {
    const translation = await makeTranslation()

    for (let i = 0; i < 5; i++) {
      await PageRevisionFactory.merge({ pageTranslationId: translation.id }).create()
    }

    const revisions = await repo.listByTranslation(translation.id, 3)
    assert.lengthOf(revisions, 3)
  })

  // ─── toggleKeep() ─────────────────────────────────────────────────────────

  test('toggleKeep() sets keep to true when it was false', async ({ assert }) => {
    const translation = await makeTranslation()
    const revision = await PageRevisionFactory.merge({
      pageTranslationId: translation.id,
      keep: false,
    }).create()

    const updated = await repo.toggleKeep(revision.id)

    assert.isTrue(updated.keep)
  })

  test('toggleKeep() sets keep to false when it was true', async ({ assert }) => {
    const translation = await makeTranslation()
    const revision = await PageRevisionFactory.merge({
      pageTranslationId: translation.id,
      keep: true,
    }).create()

    const updated = await repo.toggleKeep(revision.id)

    assert.isFalse(updated.keep)
  })

  // ─── purgeOld() ───────────────────────────────────────────────────────────

  test('purgeOld() deletes oldest non-pinned revisions beyond keepCount', async ({ assert }) => {
    const translation = await makeTranslation()

    const revisions = []
    for (let i = 0; i < 5; i++) {
      revisions.push(
        await PageRevisionFactory.merge({
          pageTranslationId: translation.id,
          keep: false,
        }).create()
      )
    }

    await repo.purgeOld(translation.id, 3)

    const remaining = await repo.listByTranslation(translation.id)
    assert.lengthOf(remaining, 3)

    // The 3 most recent should be kept
    const remainingIds = remaining.map((r) => r.id)
    assert.includeMembers(remainingIds, [revisions[2].id, revisions[3].id, revisions[4].id])
  })

  test('purgeOld() never deletes pinned revisions', async ({ assert }) => {
    const translation = await makeTranslation()

    const pinned = await PageRevisionFactory.merge({
      pageTranslationId: translation.id,
      keep: true,
    }).create()

    for (let i = 0; i < 5; i++) {
      await PageRevisionFactory.merge({ pageTranslationId: translation.id, keep: false }).create()
    }

    await repo.purgeOld(translation.id, 2)

    const remaining = await repo.listByTranslation(translation.id)
    const ids = remaining.map((r) => r.id)

    assert.includeMembers(ids, [pinned.id])
  })

  test('purgeOld() does nothing when count is below keepCount', async ({ assert }) => {
    const translation = await makeTranslation()

    for (let i = 0; i < 3; i++) {
      await PageRevisionFactory.merge({ pageTranslationId: translation.id, keep: false }).create()
    }

    await repo.purgeOld(translation.id, 10)

    const remaining = await repo.listByTranslation(translation.id)
    assert.lengthOf(remaining, 3)
  })
})
