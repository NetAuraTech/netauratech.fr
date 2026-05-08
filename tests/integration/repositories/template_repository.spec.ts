import { test } from '@japa/runner'
import { TemplateRepository } from '#repositories/template/template_repository'
import { TemplateFactory } from '#factories/template_factory'
import type { PageContent } from '#types/page'

/**
 * Integration tests for `TemplateRepository`.
 */
test.group('TemplateRepository', () => {
  const repo = new TemplateRepository()
  const emptyContent: PageContent = { blocks: [] }

  // ─── create() ─────────────────────────────────────────────────────────────

  test('create() inserts template with correct type and content', async ({ assert }) => {
    const template = await repo.create({
      name: 'Portfolio',
      type: 'page',
      blockType: null,
      content: emptyContent,
      createdBy: null,
    })

    assert.isNumber(template.id)
    assert.equal(template.name, 'Portfolio')
    assert.equal(template.type, 'page')
    assert.deepEqual(template.content, emptyContent)
  })

  test('create() stores block type correctly', async ({ assert }) => {
    const template = await repo.create({
      name: 'Section Block',
      type: 'block',
      blockType: 'section',
      content: emptyContent,
      createdBy: null,
    })

    assert.equal(template.type, 'block')
    assert.equal(template.blockType, 'section')
  })

  // ─── findById() ───────────────────────────────────────────────────────────

  test('findById() returns template with thumbnail preloaded', async ({ assert }) => {
    const template = await TemplateFactory.create()
    const found = await repo.findById(template.id)

    assert.isNotNull(found)
    assert.equal(found!.id, template.id)
  })

  test('findById() returns null for non-existent id', async ({ assert }) => {
    const result = await repo.findById(999999)
    assert.isNull(result)
  })

  // ─── list() ───────────────────────────────────────────────────────────────

  test('list() filters by type', async ({ assert }) => {
    const pageTemplate = await TemplateFactory.merge({ type: 'page' }).create()
    const blockTemplate = await TemplateFactory.merge({
      type: 'block',
      blockType: 'section',
    }).create()

    const result = await repo.list({ type: 'page' })
    const ids = result.map((t) => t.id)

    assert.includeMembers(ids, [pageTemplate.id])
    assert.notIncludeMembers(ids, [blockTemplate.id])
  })

  test('list() filters by blockType', async ({ assert }) => {
    const heroTemplate = await TemplateFactory.merge({
      type: 'block',
      blockType: 'section',
    }).create()
    const gridTemplate = await TemplateFactory.merge({ type: 'block', blockType: 'grid' }).create()

    const result = await repo.list({ blockType: 'section' })
    const ids = result.map((t) => t.id)

    assert.includeMembers(ids, [heroTemplate.id])
    assert.notIncludeMembers(ids, [gridTemplate.id])
  })

  test('list() filters by name search (case-insensitive)', async ({ assert }) => {
    const portfolio = await TemplateFactory.merge({ name: 'Unique Portfolio Layout' }).create()
    await TemplateFactory.merge({ name: 'Contact Page' }).create()

    const result = await repo.list({ search: 'unique portfolio' })
    const ids = result.map((t) => t.id)

    assert.includeMembers(ids, [portfolio.id])
    assert.lengthOf(ids, 1)
  })

  test('list() returns all when no filters provided', async ({ assert }) => {
    const t1 = await TemplateFactory.merge({ name: 'A Template' }).create()
    const t2 = await TemplateFactory.merge({ name: 'B Template' }).create()

    const result = await repo.list({})
    const ids = result.map((t) => t.id)

    assert.includeMembers(ids, [t1.id, t2.id])
  })

  test('list() orders alphabetically by name', async ({ assert }) => {
    await TemplateFactory.merge({ name: 'Zebra' }).create()
    await TemplateFactory.merge({ name: 'Apple' }).create()

    const result = await repo.list({})
    const names = result.map((t) => t.name)

    const idx = (n: string) => names.indexOf(n)
    assert.isBelow(idx('Apple'), idx('Zebra'))
  })

  // ─── update() ─────────────────────────────────────────────────────────────

  test('update() modifies only provided fields', async ({ assert }) => {
    const template = await TemplateFactory.merge({ name: 'Old name', type: 'page' }).create()

    await repo.update(template, { name: 'New name' })

    const reloaded = await repo.findById(template.id)
    assert.equal(reloaded!.name, 'New name')
    assert.equal(reloaded!.type, 'page') // unchanged
  })

  // ─── delete() ─────────────────────────────────────────────────────────────

  test('delete() removes the template from database', async ({ assert }) => {
    const template = await TemplateFactory.create()
    await repo.delete(template.id)

    const result = await repo.findById(template.id)
    assert.isNull(result)
  })
})
