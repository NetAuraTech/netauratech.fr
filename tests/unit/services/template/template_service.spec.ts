import { test } from '@japa/runner'
import sinon from 'sinon'
import { TemplateService } from '#services/template/template_service'
import Template from '#models/template/template'
import PageTranslation from '#models/page/page_translation'
import { type PageContent, type SeparatorProps } from '#types/page'

/**
 * Unit tests for `TemplateService`.
 * `TemplateRepository`, `PageTranslationRepository`, and `LogService` are mocked.
 */
test.group('TemplateService', (group) => {
  let templateRepoStub: Record<string, ReturnType<typeof sinon.stub>>
  let translationRepoStub: Record<string, ReturnType<typeof sinon.stub>>
  let logStub: Record<string, ReturnType<typeof sinon.stub>>
  let service: TemplateService

  const emptyContent: PageContent = { blocks: [] }

  function makeTemplate(id: number, type: 'page' | 'block' = 'page'): Template {
    const t = new Template()
    t.id = id
    t.name = 'My Template'
    t.type = type
    t.blockType = null
    t.content = emptyContent
    t.createdBy = null
    return t
  }

  function makeTranslation(id: number, content: PageContent = emptyContent): PageTranslation {
    const t = new PageTranslation()
    t.id = id
    t.content = content
    t.saveRevision = sinon.stub().resolves()
    return t
  }

  group.each.setup(() => {
    templateRepoStub = {
      findByIdOrFail: sinon.stub(),
      list: sinon.stub(),
      create: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    }

    translationRepoStub = {
      findByPageAndLocale: sinon.stub(),
      update: sinon.stub(),
    }

    logStub = { logBusiness: sinon.stub() }

    service = new TemplateService(
      templateRepoStub as any,
      translationRepoStub as any,
      logStub as any
    )
  })

  group.each.teardown(() => sinon.restore())

  // ─── list() ───────────────────────────────────────────────────────────────

  test('list() delegates to repository with filters', async ({ assert }) => {
    templateRepoStub.list.resolves([])
    await service.list({ type: 'page', search: 'portfolio' })
    assert.isTrue(templateRepoStub.list.calledWith({ type: 'page', search: 'portfolio' }))
  })

  // ─── detail() ─────────────────────────────────────────────────────────────

  test('detail() returns the template', async ({ assert }) => {
    const template = makeTemplate(1)
    templateRepoStub.findByIdOrFail.resolves(template)
    const result = await service.detail(1)
    assert.deepEqual(result, template)
  })

  // ─── create() ─────────────────────────────────────────────────────────────

  test('create() persists template with userId as createdBy', async ({ assert }) => {
    const template = makeTemplate(1)
    templateRepoStub.create.resolves(template)

    await service.create({ name: 'Portfolio', type: 'page', content: emptyContent }, 42)

    assert.isTrue(templateRepoStub.create.calledOnce)
    assert.equal(templateRepoStub.create.firstCall.args[0].createdBy, 42)
  })

  test('create() logs template.created event', async ({ assert }) => {
    templateRepoStub.create.resolves(makeTemplate(1))
    await service.create({ name: 'Portfolio', type: 'page', content: emptyContent }, 42)
    assert.isTrue(logStub.logBusiness.calledWith('template.created'))
  })

  // ─── update() ─────────────────────────────────────────────────────────────

  test('update() throws when template not found', async ({ assert }) => {
    templateRepoStub.findByIdOrFail.rejects(Object.assign(new Error(), { code: 'E_ROW_NOT_FOUND' }))
    await assert.rejects(() => service.update(99, { name: 'New' }))
  })

  test('update() passes only provided fields to repository', async ({ assert }) => {
    const template = makeTemplate(1)
    templateRepoStub.findByIdOrFail.resolves(template)
    templateRepoStub.update.resolves(template)

    await service.update(1, { name: 'Updated name' })

    assert.isTrue(templateRepoStub.update.calledWith(template, { name: 'Updated name' }))
  })

  // ─── delete() ─────────────────────────────────────────────────────────────

  test('delete() delegates to repository and logs event', async ({ assert }) => {
    templateRepoStub.delete.resolves()
    await service.delete(1)
    assert.isTrue(templateRepoStub.delete.calledWith(1))
    assert.isTrue(logStub.logBusiness.calledWith('template.deleted'))
  })

  // ─── applyToPage() ────────────────────────────────────────────────────────

  test('applyToPage() throws when template type is block', async ({ assert }) => {
    templateRepoStub.findByIdOrFail.resolves(makeTemplate(1, 'block'))

    try {
      await service.applyToPage(1, 10, 'en', 1)
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_INVALID_TEMPLATE_TYPE')
    }
  })

  test('applyToPage() throws E_ROW_NOT_FOUND when translation not found', async ({ assert }) => {
    templateRepoStub.findByIdOrFail.resolves(makeTemplate(1, 'page'))
    translationRepoStub.findByPageAndLocale.resolves(null)

    try {
      await service.applyToPage(1, 10, 'fr', 1)
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_ROW_NOT_FOUND')
    }
  })

  test('applyToPage() saves revision before replacing content', async ({ assert }) => {
    const template = makeTemplate(1)
    const translation = makeTranslation(5)

    templateRepoStub.findByIdOrFail.resolves(template)
    translationRepoStub.findByPageAndLocale.resolves(translation)
    translationRepoStub.update.resolves(translation)

    await service.applyToPage(1, 10, 'en', 1)

    assert.isTrue(
      (translation.saveRevision as sinon.SinonStub).calledBefore(translationRepoStub.update)
    )
  })

  test('applyToPage() replaces translation content with template content', async ({ assert }) => {
    const templateContent: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'title',
          props: {
            color: 'primary-deep',
            highlightColor: 'default',
            content: 'My title',
          },
        },
      ],
    }
    const template = makeTemplate(1)
    template.content = templateContent

    const translation = makeTranslation(5)

    templateRepoStub.findByIdOrFail.resolves(template)
    translationRepoStub.findByPageAndLocale.resolves(translation)
    translationRepoStub.update.resolves(translation)

    await service.applyToPage(1, 10, 'en', 1)

    assert.isTrue(translationRepoStub.update.calledWith(translation, { content: templateContent }))
  })

  // ─── createFromPage() ─────────────────────────────────────────────────────

  test('createFromPage() throws when translation not found', async ({ assert }) => {
    translationRepoStub.findByPageAndLocale.resolves(null)

    try {
      await service.createFromPage('My Template', 10, 'fr', 1)
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_ROW_NOT_FOUND')
    }
  })

  test('createFromPage() creates template with translation content', async ({ assert }) => {
    const pageContent: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'separator',
          props: { spacing: 'none', color: 'default' } as unknown as SeparatorProps,
        },
      ],
    }
    const translation = makeTranslation(5, pageContent)

    translationRepoStub.findByPageAndLocale.resolves(translation)
    templateRepoStub.create.resolves(makeTemplate(2))

    await service.createFromPage('My Template', 10, 'en', 1)

    const createArgs = templateRepoStub.create.firstCall.args[0]
    assert.equal(createArgs.name, 'My Template')
    assert.equal(createArgs.type, 'page')
    assert.deepEqual(createArgs.content, pageContent)
    assert.isTrue(logStub.logBusiness.calledWith('template.created_from_page'))
  })
})
