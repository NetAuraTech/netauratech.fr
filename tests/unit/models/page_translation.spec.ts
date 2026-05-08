import { test } from '@japa/runner'
import sinon from 'sinon'
import PageTranslation from '#models/page/page_translation'
import type { PageContent } from '#types/page'
import { PageRevisionRepository } from '#repositories/page/page_revision_repository'

/**
 * Unit tests for `PageTranslation.saveRevision()`.
 * The `PageRevisionRepository` is mocked to avoid DB dependencies.
 */
test.group('PageTranslation model — saveRevision()', (group) => {
  let createStub: sinon.SinonStub
  let purgeStub: sinon.SinonStub

  group.each.setup(() => {
    createStub = sinon.stub(PageRevisionRepository.prototype, 'create').resolves({} as any)
    purgeStub = sinon.stub(PageRevisionRepository.prototype, 'purgeOld').resolves()
  })

  group.each.teardown(() => {
    sinon.restore()
  })

  function makeTranslation(content: PageContent): PageTranslation {
    const t = new PageTranslation()
    t.id = 42
    t.content = content
    return t
  }

  test('creates a snapshot of the current content', async ({ assert }) => {
    const content: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'title',
          props: { text: 'Hello', level: 1, color: 'primary-deep', highlightColor: 'default' },
        },
      ],
    }
    const translation = makeTranslation(content)

    await translation.saveRevision(1)

    assert.isTrue(createStub.calledOnce)
    assert.deepEqual(createStub.firstCall.args[0].content, content)
    assert.equal(createStub.firstCall.args[0].pageTranslationId, 42)
    assert.equal(createStub.firstCall.args[0].createdBy, 1)
    assert.isFalse(createStub.firstCall.args[0].keep)
  })

  test('calls purgeOld with keepCount = 10 by default', async ({ assert }) => {
    const translation = makeTranslation({ blocks: [] })
    await translation.saveRevision(1)

    assert.isTrue(purgeStub.calledOnce)
    assert.equal(purgeStub.firstCall.args[0], 42)
    assert.equal(purgeStub.firstCall.args[1], 10)
  })

  test('calls purgeOld with custom keepCount when provided', async ({ assert }) => {
    const translation = makeTranslation({ blocks: [] })
    await translation.saveRevision(1, 5)

    assert.equal(purgeStub.firstCall.args[1], 5)
  })

  test('passes the provided userId as createdBy', async ({ assert }) => {
    const translation = makeTranslation({ blocks: [] })
    await translation.saveRevision(99)

    assert.equal(createStub.firstCall.args[0].createdBy, 99)
  })
})
