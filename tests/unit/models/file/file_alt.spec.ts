import { test } from '@japa/runner'
import FileAlt from '#models/file/file_alt'

test.group('FileAlt Model', () => {
  test('can instantiate a file alt model', async ({ assert }) => {
    const fileAlt = new FileAlt()
    fileAlt.locale = 'fr'
    fileAlt.value = 'Test alt'
    assert.equal(fileAlt.locale, 'fr')
    assert.equal(fileAlt.value, 'Test alt')
  })
})
