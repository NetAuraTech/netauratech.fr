import { test } from '@japa/runner'
import sinon from 'sinon'
import { FileFolderService } from '#services/file/file_folder_service'
import FileFolder from '#models/file/file_folder'

/**
 * Unit tests for `FileFolderService`.
 * `FileFolderRepository` is fully mocked.
 */
test.group('FileFolderService', (group) => {
  let repoStub: Record<string, ReturnType<typeof sinon.stub>>
  let service: FileFolderService

  function makeFolder(id: number, name: string, parentId: number | null = null): FileFolder {
    const f = new FileFolder()
    f.id = id
    f.name = name
    f.parentId = parentId
    return f
  }

  group.each.setup(() => {
    repoStub = {
      findById: sinon.stub(),
      listRoots: sinon.stub(),
      listChildren: sinon.stub(),
      create: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    }
    service = new FileFolderService(repoStub as any)
  })

  group.each.teardown(() => sinon.restore())

  // ─── listRoots() ──────────────────────────────────────────────────────────

  test('listRoots() delegates to repository', async ({ assert }) => {
    const folders = [makeFolder(1, 'images'), makeFolder(2, 'documents')]
    repoStub.listRoots.resolves(folders)

    const result = await service.listRoots()

    assert.isTrue(repoStub.listRoots.calledOnce)
    assert.deepEqual(result, folders)
  })

  // ─── listChildren() ───────────────────────────────────────────────────────

  test('listChildren() delegates to repository with correct parentId', async ({ assert }) => {
    const children = [makeFolder(3, 'sub', 1)]
    repoStub.listChildren.resolves(children)

    const result = await service.listChildren(1)

    assert.isTrue(repoStub.listChildren.calledWith(1))
    assert.deepEqual(result, children)
  })

  // ─── create() ─────────────────────────────────────────────────────────────

  test('create() passes name without parentId by default', async ({ assert }) => {
    const folder = makeFolder(1, 'images')
    repoStub.create.resolves(folder)

    await service.create('images')

    // Service passes parentId as-is (undefined when omitted); repo coerces to null in DB
    assert.isTrue(repoStub.create.calledOnce)
    assert.equal(repoStub.create.firstCall.args[0].name, 'images')
  })

  test('create() passes parentId when provided', async ({ assert }) => {
    const folder = makeFolder(2, 'sub', 1)
    repoStub.create.resolves(folder)

    await service.create('sub', 1)

    assert.isTrue(repoStub.create.calledWith({ name: 'sub', parentId: 1 }))
  })

  // ─── rename() ─────────────────────────────────────────────────────────────

  test('rename() updates the folder name', async ({ assert }) => {
    const folder = makeFolder(1, 'old-name')
    repoStub.findById.resolves(folder)
    repoStub.update.resolves({ ...folder, name: 'new-name' })

    await service.rename(1, 'new-name')

    assert.isTrue(repoStub.update.calledWith(folder, { name: 'new-name' }))
  })

  test('rename() throws E_ROW_NOT_FOUND when folder does not exist', async ({ assert }) => {
    repoStub.findById.resolves(null)

    try {
      await service.rename(99, 'new-name')
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_ROW_NOT_FOUND')
    }
  })

  // ─── delete() ─────────────────────────────────────────────────────────────

  test('delete() delegates to repository', async ({ assert }) => {
    repoStub.delete.resolves()

    await service.delete(1)

    assert.isTrue(repoStub.delete.calledWith(1))
  })
})
