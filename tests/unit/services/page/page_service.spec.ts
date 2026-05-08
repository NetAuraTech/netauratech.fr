import { test } from '@japa/runner'
import sinon from 'sinon'
import { PageService } from '#services/page/page_service'
import Page from '#models/page/page'
import PageTranslation from '#models/page/page_translation'
import PageRevision from '#models/page/page_revision'
import type { PageContent } from '#types/page'

/**
 * Unit tests for `PageService`.
 * All three repositories and `LogService` are fully mocked.
 */
test.group('PageService', (group) => {
  let pageRepoStub: Record<string, ReturnType<typeof sinon.stub>>
  let translationRepoStub: Record<string, ReturnType<typeof sinon.stub>>
  let revisionRepoStub: Record<string, ReturnType<typeof sinon.stub>>
  let logStub: Record<string, ReturnType<typeof sinon.stub>>
  let service: PageService

  const emptyContent: PageContent = { blocks: [] }

  function makePage(id: number, defaultLocale = 'en'): Page {
    const p = new Page()
    p.id = id
    p.defaultLocale = defaultLocale
    p.$setRelated('translations', [])
    return p
  }

  function makeTranslation(
    id: number,
    pageId: number,
    locale: string,
    status = 'draft'
  ): PageTranslation {
    const t = new PageTranslation()
    t.id = id
    t.pageId = pageId
    t.locale = locale
    t.slug = `test-slug-${id}`
    t.title = 'Test Page'
    t.content = emptyContent
    t.status = status as any
    t.saveRevision = sinon.stub().resolves()
    return t
  }

  group.each.setup(() => {
    pageRepoStub = {
      findByIdOrFail: sinon.stub(),
      findBySlug: sinon.stub(),
      list: sinon.stub(),
      create: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    }

    translationRepoStub = {
      findByPageAndLocale: sinon.stub(),
      slugExists: sinon.stub(),
      create: sinon.stub(),
      update: sinon.stub(),
      upsert: sinon.stub(),
    }

    revisionRepoStub = {
      findByIdOrFail: sinon.stub(),
      listByTranslation: sinon.stub(),
      toggleKeep: sinon.stub(),
      purgeOld: sinon.stub(),
      create: sinon.stub(),
    }

    logStub = {
      logBusiness: sinon.stub(),
    }

    service = new PageService(
      pageRepoStub as any,
      translationRepoStub as any,
      revisionRepoStub as any,
      logStub as any
    )
  })

  group.each.teardown(() => sinon.restore())

  // ─── list() ───────────────────────────────────────────────────────────────

  test('list() delegates to repository with correct filters', async ({ assert }) => {
    pageRepoStub.list.resolves({ data: [], meta: {} })
    await service.list({ status: 'published', locale: 'en' }, { page: 1, perPage: 20 })
    assert.isTrue(pageRepoStub.list.calledOnce)
    assert.equal(pageRepoStub.list.firstCall.args[0].status, 'published')
  })

  // ─── detail() ─────────────────────────────────────────────────────────────

  test('detail() returns the page', async ({ assert }) => {
    const page = makePage(1)
    pageRepoStub.findByIdOrFail.resolves(page)
    const result = await service.detail(1)
    assert.deepEqual(result, page)
  })

  // ─── findBySlug() ─────────────────────────────────────────────────────────

  test('findBySlug() returns null when not found', async ({ assert }) => {
    pageRepoStub.findBySlug.resolves(null)
    const result = await service.findBySlug('unknown')
    assert.isNull(result)
  })

  // ─── create() ─────────────────────────────────────────────────────────────

  test('create() throws E_SLUG_EXISTS when slug is taken', async ({ assert }) => {
    translationRepoStub.slugExists.resolves(true)

    try {
      await service.create(
        { defaultLocale: 'en', translation: { locale: 'en', slug: 'taken', title: 'T' } },
        1
      )
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_SLUG_EXISTS')
    }
  })

  test('create() creates page and initial translation', async ({ assert }) => {
    translationRepoStub.slugExists.resolves(false)
    const page = makePage(1)
    pageRepoStub.create.resolves(page)
    pageRepoStub.findByIdOrFail.resolves(page)
    translationRepoStub.create.resolves()

    await service.create(
      { defaultLocale: 'en', translation: { locale: 'en', slug: 'my-page', title: 'My Page' } },
      1
    )

    assert.isTrue(pageRepoStub.create.calledOnce)
    assert.isTrue(translationRepoStub.create.calledOnce)
    assert.deepEqual(translationRepoStub.create.firstCall.args[0].content, emptyContent)
  })

  test('create() logs page.created event', async ({ assert }) => {
    translationRepoStub.slugExists.resolves(false)
    const page = makePage(1)
    pageRepoStub.create.resolves(page)
    pageRepoStub.findByIdOrFail.resolves(page)
    translationRepoStub.create.resolves()

    await service.create(
      { defaultLocale: 'en', translation: { locale: 'en', slug: 'my-page', title: 'My Page' } },
      1
    )

    assert.isTrue(logStub.logBusiness.calledWith('page.created'))
  })

  // ─── update() ─────────────────────────────────────────────────────────────

  test('update() throws E_ROW_NOT_FOUND when translation locale not found', async ({ assert }) => {
    translationRepoStub.findByPageAndLocale.resolves(null)

    try {
      await service.update(1, 'fr', { title: 'New' }, 1)
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_ROW_NOT_FOUND')
    }
  })

  test('update() throws E_SLUG_EXISTS when new slug is already taken', async ({ assert }) => {
    const translation = makeTranslation(1, 1, 'en')
    translationRepoStub.findByPageAndLocale.resolves(translation)
    translationRepoStub.slugExists.resolves(true)

    try {
      await service.update(1, 'en', { slug: 'taken-slug' }, 1)
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_SLUG_EXISTS')
    }
  })

  test('update() calls saveRevision before modifying the translation', async ({ assert }) => {
    const translation = makeTranslation(1, 1, 'en')
    translationRepoStub.findByPageAndLocale.resolves(translation)
    translationRepoStub.slugExists.resolves(false)
    translationRepoStub.update.resolves(translation)

    await service.update(1, 'en', { title: 'New title' }, 1)

    assert.isTrue(
      (translation.saveRevision as sinon.SinonStub).calledBefore(translationRepoStub.update)
    )
  })

  test('update() updates metaImageId on the page when provided', async ({ assert }) => {
    const page = makePage(1)
    const translation = makeTranslation(1, 1, 'en')
    translationRepoStub.findByPageAndLocale.resolves(translation)
    translationRepoStub.slugExists.resolves(false)
    translationRepoStub.update.resolves(translation)
    pageRepoStub.findByIdOrFail.resolves(page)
    pageRepoStub.update.resolves(page)

    await service.update(1, 'en', { metaImageId: 5 }, 1)

    assert.isTrue(pageRepoStub.update.calledWith(page, { metaImageId: 5 }))
  })

  test('update() logs page.updated event', async ({ assert }) => {
    const translation = makeTranslation(1, 1, 'en')
    translationRepoStub.findByPageAndLocale.resolves(translation)
    translationRepoStub.slugExists.resolves(false)
    translationRepoStub.update.resolves(translation)

    await service.update(1, 'en', { title: 'New' }, 1)

    assert.isTrue(logStub.logBusiness.calledWith('page.updated'))
  })

  // ─── publish() ────────────────────────────────────────────────────────────

  test('publish() throws E_ROW_NOT_FOUND when translation not found', async ({ assert }) => {
    translationRepoStub.findByPageAndLocale.resolves(null)

    try {
      await service.publish(1, 'fr')
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_ROW_NOT_FOUND')
    }
  })

  test('publish() sets status to published', async ({ assert }) => {
    const translation = makeTranslation(1, 1, 'en')
    translationRepoStub.findByPageAndLocale.resolves(translation)
    translationRepoStub.update.resolves(translation)

    await service.publish(1, 'en')

    assert.isTrue(translationRepoStub.update.calledWith(translation, { status: 'published' }))
  })

  // ─── unpublish() ──────────────────────────────────────────────────────────

  test('unpublish() sets status back to draft', async ({ assert }) => {
    const translation = makeTranslation(1, 1, 'en', 'published')
    translationRepoStub.findByPageAndLocale.resolves(translation)
    translationRepoStub.update.resolves(translation)

    await service.unpublish(1, 'en')

    assert.isTrue(translationRepoStub.update.calledWith(translation, { status: 'draft' }))
  })

  // ─── delete() ─────────────────────────────────────────────────────────────

  test('delete() delegates to repository', async ({ assert }) => {
    pageRepoStub.delete.resolves()
    await service.delete(1)
    assert.isTrue(pageRepoStub.delete.calledWith(1))
  })

  // ─── createTranslation() ──────────────────────────────────────────────────

  test('createTranslation() throws E_SLUG_EXISTS when slug is taken', async ({ assert }) => {
    translationRepoStub.slugExists.resolves(true)

    try {
      await service.createTranslation(1, 'fr', { slug: 'taken', title: 'Titre' })
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_SLUG_EXISTS')
    }
  })

  test('createTranslation() deep-copies content from seedFromLocale', async ({ assert }) => {
    const sourceContent: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'title',
          props: { text: 'Hello', level: 1, color: 'primary-deep', highlightColor: 'default' },
        },
      ],
    }
    const source = makeTranslation(1, 1, 'en')
    source.content = sourceContent

    translationRepoStub.slugExists.resolves(false)
    translationRepoStub.findByPageAndLocale.resolves(source)
    translationRepoStub.create.resolves()

    await service.createTranslation(1, 'fr', { slug: 'ma-page', title: 'Ma Page' }, 'en')

    const createdContent = translationRepoStub.create.firstCall.args[0].content
    assert.deepEqual(createdContent, sourceContent)
    assert.notStrictEqual(createdContent, sourceContent) // deep copy, not reference
  })

  test('createTranslation() initialises with empty blocks when no seed locale', async ({
    assert,
  }) => {
    translationRepoStub.slugExists.resolves(false)
    translationRepoStub.create.resolves()

    await service.createTranslation(1, 'fr', { slug: 'ma-page', title: 'Ma Page' })

    assert.deepEqual(translationRepoStub.create.firstCall.args[0].content, emptyContent)
  })

  // ─── restoreRevision() ────────────────────────────────────────────────────

  test('restoreRevision() saves revision of current state before restoring', async ({ assert }) => {
    const translation = makeTranslation(10, 1, 'en')
    const revision = new PageRevision()
    revision.content = { blocks: [] }

    sinon.stub(PageTranslation, 'findOrFail').resolves(translation as any)
    revisionRepoStub.findByIdOrFail.resolves(revision)
    translationRepoStub.update.resolves(translation)

    await service.restoreRevision(10, 5, 1)

    assert.isTrue(
      (translation.saveRevision as sinon.SinonStub).calledBefore(translationRepoStub.update)
    )
  })

  test('restoreRevision() logs page.revision.restored event', async ({ assert }) => {
    const translation = makeTranslation(10, 1, 'en')
    const revision = new PageRevision()
    revision.content = emptyContent

    sinon.stub(PageTranslation, 'findOrFail').resolves(translation as any)
    revisionRepoStub.findByIdOrFail.resolves(revision)
    translationRepoStub.update.resolves(translation)

    await service.restoreRevision(10, 5, 1)

    assert.isTrue(logStub.logBusiness.calledWith('page.revision.restored'))
  })

  // ─── listRevisions() ──────────────────────────────────────────────────────

  test('listRevisions() delegates to revision repository', async ({ assert }) => {
    revisionRepoStub.listByTranslation.resolves([])
    await service.listRevisions(1)
    assert.isTrue(revisionRepoStub.listByTranslation.calledWith(1))
  })

  // ─── toggleRevisionKeep() ─────────────────────────────────────────────────

  test('toggleRevisionKeep() delegates to revision repository', async ({ assert }) => {
    const revision = new PageRevision()
    revision.keep = true
    revisionRepoStub.toggleKeep.resolves(revision)

    await service.toggleRevisionKeep(5)

    assert.isTrue(revisionRepoStub.toggleKeep.calledWith(5))
  })
})
