import { test } from '@japa/runner'
import Template from '#models/template/template'

test.group('Template Model', () => {
  test('can instantiate a template model', async ({ assert }) => {
    const tpl = new Template()
    tpl.type = 'page'
    tpl.content = { blocks: [] }
    assert.equal(tpl.type, 'page')
    assert.deepEqual(tpl.content, { blocks: [] })
  })
})
