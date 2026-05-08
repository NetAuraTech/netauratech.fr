import { test } from '@japa/runner'
import sinon from 'sinon'
import { PageService } from '#services/page/page_service'
import Page from '#models/page/page'
import PageTranslation from '#models/page/page_translation'
import type { PageContent } from '#types/page'

/**
 * Unit tests verifying that `PageService` sanitises `PageContent` before
 * persisting to the database.
 *
 * Since `sanitizePageContent` is an ESM named export it cannot be stubbed
 * with sinon. We test **behaviour** instead: pass content containing a
 * `<script>` tag and assert that what the repository receives is clean.
 *
 * This is a stronger test than stub verification — it catches bugs in both
 * the service wiring *and* the sanitizer itself.
 */
test.group('PageService — sanitization wiring', (group) => {
  let pageRepoStub: Record<string, sinon.SinonStub>
  let translationRepoStub: Record<string, sinon.SinonStub>
  let revisionRepoStub: Record<string, sinon.SinonStub>
  let logStub: Record<string, sinon.SinonStub>
  let service: PageService

  const dirtyContent: PageContent = {
    blocks: [
      {
        id: '1',
        type: 'htmltext',
        props: { content: '<p>Hello</p><script>alert("xss")</script>', align: 'left' },
      },
    ],
  }

  const dirtyNestedContent: PageContent = {
    blocks: [
      {
        id: 'section1',
        type: 'section',
        props: {
          background: 'canvas',
          paddingY: { default: 'md' },
          paddingX: { default: 'md' },
        },
        children: [
          {
            id: 'rt1',
            type: 'htmltext',
            props: { content: '<p>Safe</p><script>evil()</script>', align: 'left' },
          },
        ],
      },
    ],
  }

  function makePage(id: number): Page {
    const p = new Page()
    p.id = id
    p.defaultLocale = 'en'
    p.$setRelated('translations', [])
    return p
  }

  function makeTranslation(id: number, content: PageContent = { blocks: [] }): PageTranslation {
    const t = new PageTranslation()
    t.id = id
    t.pageId = 1
    t.locale = 'en'
    t.slug = 'test-page'
    t.title = 'Test'
    t.content = content
    t.status = 'draft' as any
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
      slugExists: sinon.stub().resolves(false),
      create: sinon.stub().resolves(makeTranslation(1)),
      update: sinon.stub().resolves(makeTranslation(1)),
      upsert: sinon.stub(),
    }

    revisionRepoStub = {
      findByIdOrFail: sinon.stub(),
      listByTranslation: sinon.stub(),
      toggleKeep: sinon.stub(),
      purgeOld: sinon.stub(),
      create: sinon.stub(),
    }

    logStub = { logBusiness: sinon.stub() }

    service = new PageService(
      pageRepoStub as any,
      translationRepoStub as any,
      revisionRepoStub as any,
      logStub as any
    )
  })

  group.each.teardown(() => sinon.restore())

  // ─── Helper to extract content passed to repo ────────────────────────────

  function getPersistedContent(stub: sinon.SinonStub): PageContent {
    return stub.firstCall.args[0].content
  }

  // ─── create() ─────────────────────────────────────────────────────────────

  test('create() strips <script> from rich_text before persisting', async ({ assert }) => {
    const page = makePage(1)
    pageRepoStub.create.resolves(page)
    pageRepoStub.findByIdOrFail.resolves(page)

    await service.create(
      {
        defaultLocale: 'en',
        translation: { locale: 'en', slug: 'my-page', title: 'Title', content: dirtyContent },
      },
      1
    )

    const persisted = getPersistedContent(translationRepoStub.create)
    const html = (persisted.blocks[0].props as any).content as string
    assert.isFalse(html.includes('<script>'), 'script tag should be stripped')
    assert.isFalse(html.includes('alert'), 'alert call should be stripped')
    assert.isTrue(html.includes('<p>Hello</p>'), 'safe content should be preserved')
  })

  test('create() sanitises rich_text nested inside a section', async ({ assert }) => {
    const page = makePage(1)
    pageRepoStub.create.resolves(page)
    pageRepoStub.findByIdOrFail.resolves(page)

    await service.create(
      {
        defaultLocale: 'en',
        translation: { locale: 'en', slug: 'page', title: 'T', content: dirtyNestedContent },
      },
      1
    )

    const persisted = getPersistedContent(translationRepoStub.create)
    const nested = persisted.blocks[0].children![0].props as any
    assert.isFalse(nested.content.includes('<script>'))
    assert.isTrue(nested.content.includes('<p>Safe</p>'))
  })

  test('create() uses empty blocks when no content provided', async ({ assert }) => {
    const page = makePage(1)
    pageRepoStub.create.resolves(page)
    pageRepoStub.findByIdOrFail.resolves(page)

    await service.create(
      { defaultLocale: 'en', translation: { locale: 'en', slug: 'page', title: 'T' } },
      1
    )

    const persisted = getPersistedContent(translationRepoStub.create)
    assert.deepEqual(persisted, { blocks: [] })
  })

  // ─── update() ─────────────────────────────────────────────────────────────

  test('update() strips <script> from rich_text before persisting', async ({ assert }) => {
    const translation = makeTranslation(1)
    translationRepoStub.findByPageAndLocale.resolves(translation)
    translationRepoStub.update.resolves(translation)

    await service.update(1, 'en', { content: dirtyContent }, 1)

    const updateArgs = translationRepoStub.update.firstCall.args[1]
    const html = updateArgs.content.blocks[0].props.content as string
    assert.isFalse(html.includes('<script>'))
    assert.isTrue(html.includes('<p>Hello</p>'))
  })

  test('update() does not include content key when not provided', async ({ assert }) => {
    const translation = makeTranslation(1)
    translationRepoStub.findByPageAndLocale.resolves(translation)
    translationRepoStub.update.resolves(translation)

    await service.update(1, 'en', { title: 'New title' }, 1)

    const updateArgs = translationRepoStub.update.firstCall.args[1]
    assert.notProperty(updateArgs, 'content')
  })

  // ─── createTranslation() ──────────────────────────────────────────────────

  test('createTranslation() strips <script> from seeded content', async ({ assert }) => {
    const source = makeTranslation(1, dirtyContent)
    translationRepoStub.findByPageAndLocale.resolves(source)
    translationRepoStub.create.resolves(makeTranslation(2))

    await service.createTranslation(1, 'fr', { slug: 'ma-page', title: 'Ma Page' }, 'en')

    const persisted = getPersistedContent(translationRepoStub.create)
    const html = (persisted.blocks[0].props as any).content as string
    assert.isFalse(html.includes('<script>'))
    assert.isTrue(html.includes('<p>Hello</p>'))
  })

  test('createTranslation() persists empty blocks when no seed locale', async ({ assert }) => {
    translationRepoStub.create.resolves(makeTranslation(2))

    await service.createTranslation(1, 'fr', { slug: 'ma-page', title: 'Ma Page' })

    const persisted = getPersistedContent(translationRepoStub.create)
    assert.deepEqual(persisted, { blocks: [] })
  })
})
