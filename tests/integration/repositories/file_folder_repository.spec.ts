import { test } from '@japa/runner'
import { FileFolderRepository } from '#repositories/file/file_folder_repository'
import { FileFolderFactory } from '#factories/file_folder_factory'

/**
 * Integration tests for `FileFolderRepository`.
 * Requires a real database connection. Each test runs inside a transaction
 * that is rolled back automatically via `withGlobalTransaction()`.
 */
test.group('FileFolderRepository', () => {
  const repo = new FileFolderRepository()

  // ─── create() ─────────────────────────────────────────────────────────────

  test('create() inserts a root folder and returns the record', async ({ assert }) => {
    const folder = await repo.create({ name: 'images', parentId: null })

    assert.isNumber(folder.id)
    assert.equal(folder.name, 'images')
    assert.isNull(folder.parentId)
  })

  test('create() inserts a nested folder with parentId', async ({ assert }) => {
    const parent = await FileFolderFactory.create()
    const child = await repo.create({ name: 'sub', parentId: parent.id })

    assert.equal(child.parentId, parent.id)
  })

  // ─── findById() ───────────────────────────────────────────────────────────

  test('findById() returns the folder', async ({ assert }) => {
    const created = await FileFolderFactory.create()
    const found = await repo.findById(created.id)

    assert.isNotNull(found)
    assert.equal(found!.id, created.id)
  })

  test('findById() returns null for non-existent id', async ({ assert }) => {
    const result = await repo.findById(999999)
    assert.isNull(result)
  })

  // ─── listRoots() ──────────────────────────────────────────────────────────

  test('listRoots() returns only folders without a parent', async ({ assert }) => {
    const parent = await FileFolderFactory.merge({ parentId: null }).create()
    await FileFolderFactory.merge({ parentId: parent.id }).create()

    const roots = await repo.listRoots()

    const ids = roots.map((f) => f.id)
    assert.includeMembers(ids, [parent.id])
    const childrenInRoots = roots.filter((f) => f.parentId !== null)
    assert.lengthOf(childrenInRoots, 0)
  })

  // ─── listChildren() ───────────────────────────────────────────────────────

  test('listChildren() returns only direct children of the given parent', async ({ assert }) => {
    const parent = await FileFolderFactory.create()
    const child1 = await FileFolderFactory.merge({ parentId: parent.id }).create()
    const child2 = await FileFolderFactory.merge({ parentId: parent.id }).create()
    await FileFolderFactory.create() // unrelated root

    const children = await repo.listChildren(parent.id)
    const ids = children.map((c) => c.id)

    assert.includeMembers(ids, [child1.id, child2.id])
    assert.lengthOf(children, 2)
  })

  // ─── update() ─────────────────────────────────────────────────────────────

  test('update() persists the name change in database', async ({ assert }) => {
    const folder = await FileFolderFactory.merge({ name: 'old-name' }).create()
    await repo.update(folder, { name: 'new-name' })

    const reloaded = await repo.findById(folder.id)
    assert.equal(reloaded!.name, 'new-name')
  })

  // ─── delete() ─────────────────────────────────────────────────────────────

  test('delete() removes the folder from database', async ({ assert }) => {
    const folder = await FileFolderFactory.create()
    await repo.delete(folder.id)

    const result = await repo.findById(folder.id)
    assert.isNull(result)
  })
})
