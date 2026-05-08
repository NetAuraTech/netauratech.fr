import { test } from '@japa/runner'
import {
  listTemplateValidator,
  showTemplateValidator,
  createTemplateValidator,
  updateTemplateValidator,
  applyTemplateValidator,
  createFromPageValidator,
} from '#validators/template'

/**
 * Unit tests for template validators.
 * No database required — pure schema validation.
 */
test.group('Template validators', () => {
  // ─── listTemplateValidator ────────────────────────────────────────────────

  test('listTemplateValidator accepts empty payload', async ({ assert }) => {
    const result = await listTemplateValidator.validate({})
    assert.isOk(result)
  })

  test('listTemplateValidator accepts valid type values', async ({ assert }) => {
    for (const type of ['page', 'block']) {
      const result = await listTemplateValidator.validate({ type })
      assert.equal(result.type, type)
    }
  })

  test('listTemplateValidator rejects unknown type', async ({ assert }) => {
    await assert.rejects(() => listTemplateValidator.validate({ type: 'layout' }))
  })

  // ─── showTemplateValidator ────────────────────────────────────────────────

  test('showTemplateValidator requires positive id', async ({ assert }) => {
    await assert.rejects(() => showTemplateValidator.validate({ id: 0 }))
    await assert.rejects(() => showTemplateValidator.validate({}))
  })

  test('showTemplateValidator accepts valid id', async ({ assert }) => {
    const result = await showTemplateValidator.validate({ id: 1 })
    assert.equal(result.id, 1)
  })

  // ─── createTemplateValidator ──────────────────────────────────────────────

  test('createTemplateValidator requires name, type, and content', async ({ assert }) => {
    await assert.rejects(() =>
      createTemplateValidator.validate({ type: 'page', content: { blocks: [] } })
    )
    await assert.rejects(() =>
      createTemplateValidator.validate({ name: 'T', content: { blocks: [] } })
    )
    await assert.rejects(() => createTemplateValidator.validate({ name: 'T', type: 'page' }))
  })

  test('createTemplateValidator accepts full valid payload', async ({ assert }) => {
    const result = await createTemplateValidator.validate({
      name: 'Portfolio',
      type: 'page',
      content: { blocks: [] },
    })
    assert.equal(result.name, 'Portfolio')
    assert.equal(result.type, 'page')
  })

  test('createTemplateValidator accepts block type with blockType field', async ({ assert }) => {
    const result = await createTemplateValidator.validate({
      name: 'Hero Block',
      type: 'block',
      blockType: 'hero',
      content: { blocks: [] },
    })
    assert.equal(result.type, 'block')
    assert.equal(result.blockType, 'hero')
  })

  test('createTemplateValidator accepts description as null', async ({ assert }) => {
    const result = await createTemplateValidator.validate({
      name: 'T',
      type: 'page',
      description: null,
      content: { blocks: [] },
    })
    assert.isNull(result.description)
  })

  test('createTemplateValidator trims name', async ({ assert }) => {
    const result = await createTemplateValidator.validate({
      name: '  My Template  ',
      type: 'page',
      content: { blocks: [] },
    })
    assert.equal(result.name, 'My Template')
  })

  // ─── updateTemplateValidator ──────────────────────────────────────────────

  test('updateTemplateValidator accepts empty payload', async ({ assert }) => {
    const result = await updateTemplateValidator.validate({})
    assert.isOk(result)
  })

  test('updateTemplateValidator accepts partial update', async ({ assert }) => {
    const result = await updateTemplateValidator.validate({ name: 'New name' })
    assert.equal(result.name, 'New name')
  })

  // ─── applyTemplateValidator ───────────────────────────────────────────────

  test('applyTemplateValidator requires pageId and locale', async ({ assert }) => {
    await assert.rejects(() => applyTemplateValidator.validate({ locale: 'en' }))
    await assert.rejects(() => applyTemplateValidator.validate({ pageId: 1 }))
  })

  test('applyTemplateValidator accepts valid payload', async ({ assert }) => {
    const result = await applyTemplateValidator.validate({ pageId: 5, locale: 'fr' })
    assert.equal(result.pageId, 5)
    assert.equal(result.locale, 'fr')
  })

  test('applyTemplateValidator rejects non-positive pageId', async ({ assert }) => {
    await assert.rejects(() => applyTemplateValidator.validate({ pageId: 0, locale: 'en' }))
  })

  // ─── createFromPageValidator ──────────────────────────────────────────────

  test('createFromPageValidator requires name, pageId, and locale', async ({ assert }) => {
    await assert.rejects(() => createFromPageValidator.validate({ pageId: 1, locale: 'en' }))
    await assert.rejects(() => createFromPageValidator.validate({ name: 'T', locale: 'en' }))
    await assert.rejects(() => createFromPageValidator.validate({ name: 'T', pageId: 1 }))
  })

  test('createFromPageValidator accepts valid payload', async ({ assert }) => {
    const result = await createFromPageValidator.validate({
      name: 'My Template',
      pageId: 3,
      locale: 'en',
    })
    assert.equal(result.name, 'My Template')
    assert.equal(result.pageId, 3)
    assert.equal(result.locale, 'en')
  })
})
