import { test } from '@japa/runner'
import Page from '#models/page/page'
import PageTranslation from '#models/page/page_translation'

/**
 * Unit tests for the `Page` model.
 * Focus: `translationFor()` locale resolution logic.
 */
test.group('Page model — translationFor()', () => {
  function makePage(defaultLocale: string, translations: Partial<PageTranslation>[]): Page {
    const page = new Page()
    page.defaultLocale = defaultLocale

    const translationInstances = translations.map((t) => {
      const tr = new PageTranslation()
      Object.assign(tr, t)
      return tr
    })

    page.$setRelated('translations', translationInstances)

    return page
  }

  test('returns the translation matching the requested locale', ({ assert }) => {
    const page = makePage('en', [
      { locale: 'en', title: 'English title' },
      { locale: 'fr', title: 'French title' },
    ])
    assert.equal(page.translationFor('fr')?.title, 'French title')
  })

  test('falls back to defaultLocale when requested locale is not available', ({ assert }) => {
    const page = makePage('en', [{ locale: 'en', title: 'English title' }])
    assert.equal(page.translationFor('de')?.title, 'English title')
  })

  test('returns undefined when no translations exist at all', ({ assert }) => {
    const page = makePage('en', [])
    assert.isUndefined(page.translationFor('en'))
  })

  test('returns undefined when neither requested locale nor default locale exist', ({ assert }) => {
    const page = makePage('en', [{ locale: 'fr', title: 'French title' }])
    assert.isUndefined(page.translationFor('de'))
  })

  test('returns the exact match when requested locale equals defaultLocale', ({ assert }) => {
    const page = makePage('en', [{ locale: 'en', title: 'English title' }])
    assert.equal(page.translationFor('en')?.title, 'English title')
  })

  test('prefers exact locale match over defaultLocale fallback', ({ assert }) => {
    const page = makePage('en', [
      { locale: 'en', title: 'English' },
      { locale: 'fr', title: 'French' },
    ])
    assert.equal(page.translationFor('fr')?.title, 'French')
  })
})
