import { test } from '@japa/runner'
import { PageTranslationRepository } from '#repositories/page/page_translation_repository'
import { PageFactory, PageTranslationFactory } from '#factories/page_factory'

test.group('PageTranslationRepository', () => {
  const repo = new PageTranslationRepository()

  const createBasePage = async () => {
    return await PageFactory.create()
  }

  test('findById() returns the translation', async ({ assert }) => {
    const page = await createBasePage()
    const translation = await PageTranslationFactory.merge({ pageId: page.id }).create()

    const found = await repo.findById(translation.id)
    assert.isNotNull(found)
    assert.equal(found!.id, translation.id)
  })

  test('findByPageAndLocale() finds the specific translation', async ({ assert }) => {
    const page = await createBasePage()
    await PageTranslationFactory.merge({ pageId: page.id, locale: 'en' }).create()
    const frTranslation = await PageTranslationFactory.merge({
      pageId: page.id,
      locale: 'fr',
    }).create()

    const found = await repo.findByPageAndLocale(page.id, 'fr')
    assert.isNotNull(found)
    assert.equal(found!.id, frTranslation.id)
  })

  test('findBySlug() finds translation by slug', async ({ assert }) => {
    const page = await createBasePage()
    const slug = `slug-${Date.now()}`
    await PageTranslationFactory.merge({ pageId: page.id, slug }).create()

    const found = await repo.findBySlug(slug)
    assert.isNotNull(found)
    assert.equal(found!.slug, slug)
  })

  test('create() inserts a new translation', async ({ assert }) => {
    const page = await createBasePage()
    const slug = `create-slug-${Date.now()}`

    const translation = await repo.create({
      pageId: page.id,
      locale: 'es',
      slug,
      title: 'Spanish Title',
      content: { blocks: [] },
    })

    assert.isNumber(translation.id)
    assert.equal(translation.locale, 'es')
    assert.equal(translation.title, 'Spanish Title')
    assert.equal(translation.status, 'draft') // Default status
  })

  test('update() modifies existing translation', async ({ assert }) => {
    const page = await createBasePage()
    const translation = await PageTranslationFactory.merge({ pageId: page.id }).create()

    const updated = await repo.update(translation, { title: 'New Title', status: 'published' })
    assert.equal(updated.title, 'New Title')
    assert.equal(updated.status, 'published')

    const reloaded = await repo.findById(translation.id)
    assert.equal(reloaded!.title, 'New Title')
  })

  test('upsert() creates new when none exists', async ({ assert }) => {
    const page = await createBasePage()
    const slug = `upsert-new-${Date.now()}`

    const translation = await repo.upsert(page.id, 'it', {
      slug,
      title: 'Italian',
      content: { blocks: [] },
    })

    assert.isNumber(translation.id)
    assert.equal(translation.locale, 'it')
    assert.equal(translation.slug, slug)
  })

  test('upsert() updates existing when one exists', async ({ assert }) => {
    const page = await createBasePage()
    const slug = `upsert-ext-${Date.now()}`

    const existing = await PageTranslationFactory.merge({
      pageId: page.id,
      locale: 'it',
      title: 'Old IT',
    }).create()

    const updated = await repo.upsert(page.id, 'it', {
      slug,
      title: 'New IT',
      content: { blocks: [] },
    })

    assert.equal(updated.id, existing.id)
    assert.equal(updated.title, 'New IT')
  })

  test('slugExists() checks for exact matches and handles exclusions', async ({ assert }) => {
    const page = await createBasePage()
    const slug = `exists-slug-${Date.now()}`

    const translation = await PageTranslationFactory.merge({ pageId: page.id, slug }).create()

    assert.isTrue(await repo.slugExists(slug))
    assert.isFalse(await repo.slugExists('non-existent-slug'))

    // Test excludeId
    assert.isFalse(await repo.slugExists(slug, translation.id))
  })
})
