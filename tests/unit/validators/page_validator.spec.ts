import { test } from '@japa/runner'
import {
  listPageValidator,
  showPageValidator,
  createPageValidator,
  updatePageValidator,
  publishPageValidator,
  createTranslationValidator,
  revisionValidator,
} from '#validators/page'

/**
 * Unit tests for page validators.
 * No database required — pure schema validation.
 */
test.group('Page validators', () => {
  // ─── listPageValidator ────────────────────────────────────────────────────

  test('listPageValidator accepts all optional fields empty', async ({ assert }) => {
    const result = await listPageValidator.validate({})
    assert.isOk(result)
  })

  test('listPageValidator accepts valid status values', async ({ assert }) => {
    for (const status of ['draft', 'published', 'archived']) {
      const result = await listPageValidator.validate({ status })
      assert.equal(result.status, status)
    }
  })

  test('listPageValidator rejects unknown status', async ({ assert }) => {
    await assert.rejects(() => listPageValidator.validate({ status: 'deleted' }))
  })

  // ─── showPageValidator ────────────────────────────────────────────────────

  test('showPageValidator accepts positive id', async ({ assert }) => {
    const result = await showPageValidator.validate({ id: 1 })
    assert.equal(result.id, 1)
  })

  test('showPageValidator rejects non-positive id', async ({ assert }) => {
    await assert.rejects(() => showPageValidator.validate({ id: 0 }))
    await assert.rejects(() => showPageValidator.validate({ id: -1 }))
  })

  test('showPageValidator rejects missing id', async ({ assert }) => {
    await assert.rejects(() => showPageValidator.validate({}))
  })

  // ─── createPageValidator ──────────────────────────────────────────────────

  test('createPageValidator accepts valid payload', async ({ assert }) => {
    const result = await createPageValidator.validate({
      locale: 'en',
      slug: 'my-page',
      title: 'My Page',
    })
    assert.equal(result.slug, 'my-page')
  })

  test('createPageValidator lowercases slug before regex validation', async ({ assert }) => {
    // .toLowerCase() runs before the regex — 'MyPage' becomes 'mypage' which passes
    const result = await createPageValidator.validate({
      locale: 'en',
      slug: 'MyPage',
      title: 'Title',
    })
    assert.equal(result.slug, 'mypage')
  })

  test('createPageValidator rejects slug with spaces', async ({ assert }) => {
    await assert.rejects(() =>
      createPageValidator.validate({
        locale: 'en',
        slug: 'my page',
        title: 'Title',
      })
    )
  })

  test('createPageValidator rejects slug with forward slash', async ({ assert }) => {
    await assert.rejects(() =>
      createPageValidator.validate({
        locale: 'en',
        slug: 'my/page',
        title: 'Title',
      })
    )
  })

  test('createPageValidator accepts slug with hyphens and numbers', async ({ assert }) => {
    const result = await createPageValidator.validate({
      locale: 'en',
      slug: 'my-page-2024',
      title: 'Title',
    })
    assert.equal(result.slug, 'my-page-2024')
  })

  test('createPageValidator accepts optional metaImageId as null', async ({ assert }) => {
    const result = await createPageValidator.validate({
      metaImageId: null,
      locale: 'en',
      slug: 'page',
      title: 'T',
    })
    assert.isNull(result.metaImageId)
  })

  // ─── updatePageValidator ──────────────────────────────────────────────────

  test('updatePageValidator requires locale', async ({ assert }) => {
    await assert.rejects(() => updatePageValidator.validate({ title: 'New' }))
  })

  test('updatePageValidator accepts partial payload', async ({ assert }) => {
    const result = await updatePageValidator.validate({ locale: 'en', title: 'New title' })
    assert.equal(result.title, 'New title')
    assert.isUndefined(result.slug)
  })

  test('updatePageValidator trims and lowercases slug', async ({ assert }) => {
    const result = await updatePageValidator.validate({ locale: 'en', slug: 'my-page' })
    assert.equal(result.slug, 'my-page')
  })

  // ─── publishPageValidator ─────────────────────────────────────────────────

  test('publishPageValidator requires locale', async ({ assert }) => {
    await assert.rejects(() => publishPageValidator.validate({}))
  })

  test('publishPageValidator accepts valid locale', async ({ assert }) => {
    const result = await publishPageValidator.validate({ locale: 'fr' })
    assert.equal(result.locale, 'fr')
  })

  // ─── createTranslationValidator ───────────────────────────────────────────

  test('createTranslationValidator accepts optional seedFromLocale', async ({ assert }) => {
    const result = await createTranslationValidator.validate({
      locale: 'fr',
      slug: 'ma-page',
      title: 'Ma Page',
      seedFromLocale: 'en',
    })
    assert.equal(result.seedFromLocale, 'en')
  })

  test('createTranslationValidator rejects locale longer than 10 chars', async ({ assert }) => {
    await assert.rejects(() =>
      createTranslationValidator.validate({ locale: 'en-US-extra-long', slug: 'page', title: 'T' })
    )
  })

  // ─── revisionValidator ────────────────────────────────────────────────────

  test('revisionValidator requires both positive IDs', async ({ assert }) => {
    await assert.rejects(() => revisionValidator.validate({ translationId: 1 }))
    await assert.rejects(() => revisionValidator.validate({ revisionId: 1 }))
    await assert.rejects(() => revisionValidator.validate({ translationId: 0, revisionId: 1 }))
  })

  test('revisionValidator accepts valid IDs', async ({ assert }) => {
    const result = await revisionValidator.validate({ translationId: 3, revisionId: 7 })
    assert.equal(result.translationId, 3)
    assert.equal(result.revisionId, 7)
  })
})
