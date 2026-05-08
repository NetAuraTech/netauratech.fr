import { test } from '@japa/runner'
import { PageRepository } from '#repositories/page/page_repository'
import { PageFactory, PageTranslationFactory, PageRevisionFactory } from '#factories/page_factory'

/**
 * Integration tests for `PageRepository`.
 */
test.group('PageRepository', () => {
  const repo = new PageRepository()

  // ─── findBySlug() ─────────────────────────────────────────────────────────

  test('findBySlug() returns null when no published translation matches', async ({ assert }) => {
    const page = await PageFactory.create()
    await PageTranslationFactory.merge({
      pageId: page.id,
      slug: 'draft-page',
      status: 'draft',
    }).create()

    const result = await repo.findBySlug('draft-page')
    assert.isNull(result)
  })

  test('findBySlug() returns page when a published translation matches', async ({ assert }) => {
    const page = await PageFactory.create()
    await PageTranslationFactory.merge({
      pageId: page.id,
      slug: 'live-page',
      status: 'published',
    }).create()

    const result = await repo.findBySlug('live-page')
    assert.isNotNull(result)
    assert.equal(result!.id, page.id)
  })

  test('findBySlug() returns null for unknown slug', async ({ assert }) => {
    const result = await repo.findBySlug('no-such-page')
    assert.isNull(result)
  })

  // ─── findById() & findByIdOrFail() ────────────────────────────────────────

  test('findById() returns the page with relations', async ({ assert }) => {
    const page = await PageFactory.create()
    const found = await repo.findById(page.id)
    assert.isNotNull(found)
    assert.equal(found!.id, page.id)
  })

  test('findByIdOrFail() returns page or throws', async ({ assert }) => {
    const page = await PageFactory.create()
    const found = await repo.findByIdOrFail(page.id)
    assert.equal(found.id, page.id)
    await assert.rejects(() => repo.findByIdOrFail(999999))
  })

  // ─── findHomepage() & setHomepage() ───────────────────────────────────────

  test('findHomepage() returns the homepage if set', async ({ assert }) => {
    await PageFactory.create() // Not homepage
    const homepage = await PageFactory.merge({ isHomepage: true }).create()

    const result = await repo.findHomepage()
    assert.isNotNull(result)
    assert.equal(result!.id, homepage.id)
  })

  test('setHomepage() sets the flag and unsets previous', async ({ assert }) => {
    let p1 = await repo.findHomepage()
    if (!p1) {
      p1 = await PageFactory.merge({ isHomepage: true }).create()
    }
    const p2 = await PageFactory.merge({ isHomepage: false }).create()

    await repo.setHomepage(p2.id)

    const reloadedP1 = await repo.findById(p1.id)
    const reloadedP2 = await repo.findById(p2.id)

    assert.isFalse(reloadedP1!.isHomepage)
    assert.isTrue(reloadedP2!.isHomepage)
  })

  // ─── create() & update() ──────────────────────────────────────────────────

  test('create() inserts a new page', async ({ assert }) => {
    const { UserFactory } = await import('#factories/user_factory')
    const user = await UserFactory.create()
    const page = await repo.create({ defaultLocale: 'fr', createdBy: user.id })
    assert.isNumber(page.id)
    assert.equal(page.defaultLocale, 'fr')
  })

  test('update() modifies existing page', async ({ assert }) => {
    const page = await PageFactory.merge({ defaultLocale: 'en' }).create()
    const updated = await repo.update(page, { defaultLocale: 'es' })
    assert.equal(updated.defaultLocale, 'es')
  })

  // ─── list() ───────────────────────────────────────────────────────────────

  test('list() filters pages by translation status', async ({ assert }) => {
    const publishedPage = await PageFactory.create()
    await PageTranslationFactory.merge({ pageId: publishedPage.id, status: 'published' }).create()

    const draftPage = await PageFactory.create()
    await PageTranslationFactory.merge({ pageId: draftPage.id, status: 'draft' }).create()

    const result = await repo.list({ status: 'published' }, { page: 1, perPage: 20 })
    const ids = result.all().map((p: any) => p.id)

    assert.includeMembers(ids, [publishedPage.id])
    assert.notIncludeMembers(ids, [draftPage.id])
  })

  test('list() filters by locale', async ({ assert }) => {
    const enPage = await PageFactory.create()
    await PageTranslationFactory.merge({
      pageId: enPage.id,
      locale: 'en',
      slug: 'en-page',
    }).create()

    const frPage = await PageFactory.create()
    await PageTranslationFactory.merge({
      pageId: frPage.id,
      locale: 'fr',
      slug: 'fr-page',
    }).create()

    const result = await repo.list({ locale: 'fr' }, { page: 1, perPage: 20 })
    const ids = result.all().map((p: any) => p.id)

    assert.includeMembers(ids, [frPage.id])
    assert.notIncludeMembers(ids, [enPage.id])
  })

  test('list() filters by search on translation title', async ({ assert }) => {
    const page = await PageFactory.create()
    await PageTranslationFactory.merge({
      pageId: page.id,
      title: 'About us test',
      slug: 'about-test',
    }).create()

    const otherPage = await PageFactory.create()
    await PageTranslationFactory.merge({
      pageId: otherPage.id,
      title: 'Contact test',
      slug: 'contact-test',
    }).create()

    const result = await repo.list({ search: 'about us test' }, { page: 1, perPage: 20 })
    const ids = result.all().map((p: any) => p.id)

    assert.includeMembers(ids, [page.id])
    assert.notIncludeMembers(ids, [otherPage.id])
  })

  // ─── delete() ─────────────────────────────────────────────────────────────

  test('delete() cascades to translations and revisions', async ({ assert }) => {
    const page = await PageFactory.create()
    const translation = await PageTranslationFactory.merge({
      pageId: page.id,
      slug: `to-delete-${Date.now()}`,
    }).create()
    await PageRevisionFactory.merge({ pageTranslationId: translation.id }).create()

    await repo.delete(page.id)

    const found = await repo.findById(page.id)
    assert.isNull(found)

    const { default: PageTranslation } = await import('#models/page/page_translation')
    const tr = await PageTranslation.find(translation.id)
    assert.isNull(tr)
  })

  // ─── listForLinks() & listPublishedForSitemap() ───────────────────────────

  test('listForLinks() returns only necessary fields for links', async ({ assert }) => {
    const page = await PageFactory.create()
    await PageTranslationFactory.merge({ pageId: page.id }).create()

    const result = await repo.listForLinks()
    assert.isArray(result)

    // Pick the page we created
    const found = result.find((p) => p.id === page.id)
    assert.isNotNull(found)
    assert.isDefined(found!.defaultLocale)
    assert.isDefined(found!.translations[0].title)
    assert.isDefined(found!.translations[0].locale)
    assert.isDefined(found!.translations[0].slug)
    // Content should not be loaded
    assert.isUndefined(found!.translations[0].content)
  })

  test('listPublishedForSitemap() returns only published translations', async ({ assert }) => {
    const draftPage = await PageFactory.create()
    await PageTranslationFactory.merge({ pageId: draftPage.id, status: 'draft' }).create()

    const publishedPage = await PageFactory.create()
    await PageTranslationFactory.merge({ pageId: publishedPage.id, status: 'published' }).create()

    const mixedPage = await PageFactory.create()
    await PageTranslationFactory.merge({
      pageId: mixedPage.id,
      locale: 'en',
      status: 'published',
    }).create()
    await PageTranslationFactory.merge({
      pageId: mixedPage.id,
      locale: 'fr',
      status: 'draft',
    }).create()

    const result = await repo.listPublishedForSitemap()
    const ids = result.map((p) => p.id)

    // Draft only page should be omitted
    assert.notIncludeMembers(ids, [draftPage.id])
    assert.includeMembers(ids, [publishedPage.id, mixedPage.id])

    // For the mixed page, only the published translation should be loaded
    const mixed = result.find((p) => p.id === mixedPage.id)
    assert.lengthOf(mixed!.translations, 1)
    assert.equal(mixed!.translations[0].locale, 'en')
  })
})
