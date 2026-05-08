import { test } from '@japa/runner'
import File from '#models/file/file'
import FileAlt from '#models/file/file_alt'

/**
 * Unit tests for the `File` model.
 * Focus: `resolveAlt()` logic — no DB required, we construct instances directly.
 */
test.group('File model — resolveAlt()', () => {
  function makeFile(alts: Partial<FileAlt>[] = []): File {
    const file = new File()
    file.id = 1

    const altInstances = alts.map((a) => {
      const alt = new FileAlt()
      Object.assign(alt, a)
      return alt
    })

    file.$setRelated('alts', altInstances)
    return file
  }

  test('returns altOverride when provided, ignoring key', ({ assert }) => {
    const file = makeFile([{ locale: 'en', key: 'hero', value: 'Named alt' }])
    const result = file.resolveAlt('en', 'hero', 'Override text')
    assert.equal(result, 'Override text')
  })

  test('empty string altOverride is falsy and falls through to named alt lookup', ({ assert }) => {
    // resolveAlt uses `if (override)` — empty string is falsy, so it falls through
    const file = makeFile([{ locale: 'en', key: 'hero', value: 'Named alt' }])
    const result = file.resolveAlt('en', 'hero', '')
    assert.equal(result, 'Named alt')
  })

  test('returns the named alt value for matching locale and key', ({ assert }) => {
    const file = makeFile([
      { locale: 'en', key: 'hero', value: 'English hero alt' },
      { locale: 'fr', key: 'hero', value: 'French hero alt' },
    ])
    assert.equal(file.resolveAlt('en', 'hero'), 'English hero alt')
    assert.equal(file.resolveAlt('fr', 'hero'), 'French hero alt')
  })

  test('does not confuse two different keys for the same locale', ({ assert }) => {
    const file = makeFile([
      { locale: 'en', key: 'hero', value: 'Hero alt' },
      { locale: 'en', key: 'thumbnail', value: 'Thumbnail alt' },
    ])
    assert.equal(file.resolveAlt('en', 'hero'), 'Hero alt')
    assert.equal(file.resolveAlt('en', 'thumbnail'), 'Thumbnail alt')
  })

  test('returns empty string when key is null and no override', ({ assert }) => {
    const file = makeFile([{ locale: 'en', key: 'hero', value: 'Hero alt' }])
    assert.equal(file.resolveAlt('en', null), '')
  })

  test('returns empty string when no alt matches the locale', ({ assert }) => {
    const file = makeFile([{ locale: 'en', key: 'hero', value: 'Hero alt' }])
    assert.equal(file.resolveAlt('de', 'hero'), '')
  })

  test('returns empty string when no alt matches the key', ({ assert }) => {
    const file = makeFile([{ locale: 'en', key: 'hero', value: 'Hero alt' }])
    assert.equal(file.resolveAlt('en', 'thumbnail'), '')
  })

  test('returns empty string when alts array is empty', ({ assert }) => {
    const file = makeFile([])
    assert.equal(file.resolveAlt('en', 'hero'), '')
  })

  test('null altOverride falls through to named alt lookup', ({ assert }) => {
    const file = makeFile([{ locale: 'en', key: 'hero', value: 'Named alt' }])
    assert.equal(file.resolveAlt('en', 'hero', null), 'Named alt')
  })
})
