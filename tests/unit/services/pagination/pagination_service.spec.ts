import { test } from '@japa/runner'
import { PaginationService } from '#services/pagination/pagination_service'
import User from '#models/auth/user'
import { DEFAULT_PAGINATION } from '#types/pagination'

test.group('PaginationService', () => {
  test('paginate() returns results with default page and perPage', async ({ assert }) => {
    const service = new PaginationService()
    await User.create({ email: 'page1@example.com', username: 'page1' })
    await User.create({ email: 'page2@example.com', username: 'page2' })

    const query = User.query()
    const result = await service.paginate({ query, filters: {} })

    assert.equal(result.currentPage, DEFAULT_PAGINATION.page)
    assert.equal(result.perPage, DEFAULT_PAGINATION.perPage)
    assert.isTrue(result.total > 0)
  })

  test('paginate() respects custom page and perPage', async ({ assert }) => {
    const service = new PaginationService()

    const query = User.query()
    const result = await service.paginate({ query, filters: { page: 2, perPage: 1 } })

    assert.equal(result.currentPage, 2)
    assert.equal(result.perPage, 1)
  })

  test('paginate() applies conditional filters correctly', async ({ assert }) => {
    const service = new PaginationService()

    const query = User.query()
    let filterApplied = false

    await service.paginate({
      query,
      filters: {},
      conditionalFilters: [
        {
          value: true,
          apply: (q) => {
            filterApplied = true
            q.where('id', -1)
          },
        },
        {
          value: false,
          apply: () => {
            assert.fail('Should not apply filter when value is falsy')
          },
        },
      ],
    })

    assert.isTrue(filterApplied)
  })
})
