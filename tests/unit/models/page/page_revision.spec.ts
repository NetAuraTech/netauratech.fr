import { test } from '@japa/runner'
import PageRevision from '#models/page/page_revision'

test.group('PageRevision Model', () => {
  test('can instantiate a page revision model', async ({ assert }) => {
    const revision = new PageRevision()
    revision.content = { blocks: [] }
    assert.deepEqual(revision.content, { blocks: [] })
  })
})
