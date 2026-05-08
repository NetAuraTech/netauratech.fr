import { test } from '@japa/runner'
import FileFolder from '#models/file/file_folder'

test.group('FileFolder Model', () => {
  test('can instantiate a file folder model', async ({ assert }) => {
    const folder = new FileFolder()
    folder.name = 'Test Folder'
    assert.equal(folder.name, 'Test Folder')
  })

  test('roots scope queries for folders with no parent', async ({ assert }) => {
    const query = FileFolder.query().apply((scopes) => scopes.roots())
    const sql = query.toQuery()
    assert.include(sql, 'where "parent_id" is null')
  })
})
