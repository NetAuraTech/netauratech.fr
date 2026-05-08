import { test } from '@japa/runner'
import { PermissionRepository } from '#repositories/auth/permission_repository'
import Permission from '#models/auth/permission'

test.group('PermissionRepository', () => {
  const repo = new PermissionRepository()

  test('create() and findById() work together', async ({ assert }) => {
    const perm = await repo.create({
      name: 'Test create',
      slug: 'test.create',
      category: 'test',
      description: 'Test create',
    })
    const found = await repo.findById(perm.id)
    assert.isNotNull(found)
    assert.equal(found!.slug, 'test.create')
  })

  test('findAll() returns all permissions with limit and pagination', async ({ assert }) => {
    await repo.create({ name: 'All 1', slug: 'all.1', category: 'all' })
    await repo.create({ name: 'All 2', slug: 'all.2', category: 'all' })

    const results = await repo.findAll({ limit: 1 })
    assert.lengthOf(results, 1)
  })

  test('findBySlug() finds by slug', async ({ assert }) => {
    await repo.create({ name: 'Slug Test', slug: 'slug.test', category: 'slug' })
    const found = await repo.findBySlug('slug.test')
    assert.isNotNull(found)
    assert.equal(found!.category, 'slug')
  })

  test('findByCategory() returns permissions of a specific category', async ({ assert }) => {
    await repo.create({ name: 'Cat 1', slug: 'cat.1', category: 'unique_cat' })
    await repo.create({ name: 'Cat 2', slug: 'cat.2', category: 'unique_cat' })
    await repo.create({ name: 'Other 1', slug: 'other.1', category: 'other_cat' })

    const found = await repo.findByCategory('unique_cat')
    assert.lengthOf(found, 2)
  })

  test('findByIdOrFail() throws when not found', async ({ assert }) => {
    await assert.rejects(() => repo.findByIdOrFail(999999))
  })

  test('update() modifies a permission', async ({ assert }) => {
    const perm = await repo.create({ name: 'Update Test', slug: 'update.test', category: 'update' })
    const updated = await repo.update(perm.id, { category: 'updated_cat' })
    assert.isNotNull(updated)
    assert.equal(updated!.category, 'updated_cat')

    const notFound = await repo.update(999999, { category: 'foo' })
    assert.isNull(notFound)
  })

  test('delete() removes a permission', async ({ assert }) => {
    const perm = await repo.create({ name: 'Delete Test', slug: 'delete.test', category: 'delete' })
    const result = await repo.delete(perm.id)
    assert.isTrue(result)

    const result2 = await repo.delete(999999)
    assert.isFalse(result2)

    const found = await repo.findById(perm.id)
    assert.isNull(found)
  })

  test('count() returns count of matching records', async ({ assert }) => {
    await Permission.query().delete() // Cleanup first to ensure exact counts
    await repo.create({ name: 'Count 1', slug: 'count.1', category: 'count_cat' })
    await repo.create({ name: 'Count 2', slug: 'count.2', category: 'count_cat' })
    await repo.create({ name: 'Count 3', slug: 'count.3', category: 'other_cat' })

    assert.equal(await repo.count(), 3)
    assert.equal(await repo.count({ category: 'count_cat' }), 2)
  })

  test('slugExists() checks existence', async ({ assert }) => {
    await repo.create({ name: 'Exists Test', slug: 'exists.test', category: 'exists' })
    assert.isTrue(await repo.slugExists('exists.test'))
    assert.isFalse(await repo.slugExists('not.exists'))
  })

  test('getCategories() returns distinct sorted categories', async ({ assert }) => {
    await Permission.query().delete()
    await repo.create({ name: 'Cat B1', slug: 'cat.b1', category: 'b_cat' })
    await repo.create({ name: 'Cat A1', slug: 'cat.a1', category: 'a_cat' })
    await repo.create({ name: 'Cat A2', slug: 'cat.a2', category: 'a_cat' })

    const categories = await repo.getCategories()
    assert.deepEqual(categories, ['a_cat', 'b_cat'])
  })
})
