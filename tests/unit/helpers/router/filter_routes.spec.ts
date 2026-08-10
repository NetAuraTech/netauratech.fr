import { test } from '@japa/runner'
import { filterRoutes } from '#helpers/router/filter_routes'

function makeRoute(
  methods: string[],
  name?: string,
  pattern = '/'
): { methods: string[]; name?: string; pattern: string } {
  return { methods, name, pattern }
}

test.group('filterRoutes', () => {
  test('filters routes by HTTP method', ({ assert }) => {
    const routes = [
      makeRoute(['GET', 'POST'], 'home'),
      makeRoute(['POST'], 'submit'),
      makeRoute(['GET'], 'about'),
    ]

    const getRoutes = filterRoutes(routes, 'GET')
    assert.lengthOf(getRoutes, 2)
    assert.deepEqual(
      getRoutes.map((r) => r.name),
      ['home', 'about']
    )

    const postRoutes = filterRoutes(routes, 'POST')
    assert.lengthOf(postRoutes, 2)
    assert.deepEqual(
      postRoutes.map((r) => r.name),
      ['home', 'submit']
    )
  })

  test('excludes routes without a name', ({ assert }) => {
    const routes = [makeRoute(['GET'], 'named'), makeRoute(['GET'])]

    const result = filterRoutes(routes, 'GET')
    assert.lengthOf(result, 1)
    assert.equal(result[0].name, 'named')
  })

  test('excludes routes by prefix', ({ assert }) => {
    const routes = [
      makeRoute(['GET'], 'admin.dashboard'),
      makeRoute(['GET'], 'api.users'),
      makeRoute(['GET'], 'pages.edit'),
    ]

    const result = filterRoutes(routes, 'GET', ['admin.', 'api.'])
    assert.lengthOf(result, 1)
    assert.equal(result[0].name, 'pages.edit')
  })

  test('excludes routes by exact name match', ({ assert }) => {
    const routes = [makeRoute(['GET'], 'pages.show'), makeRoute(['GET'], 'pages.edit')]

    const result = filterRoutes(routes, 'GET', ['pages.show'])
    assert.lengthOf(result, 1)
    assert.equal(result[0].name, 'pages.edit')
  })

  test('extracts params from route pattern', ({ assert }) => {
    const routes = [
      makeRoute(['GET'], 'pages.edit', '/pages/:id/edit'),
      makeRoute(['GET'], 'users.show', '/users/:username'),
      makeRoute(['GET'], 'home', '/'),
    ]

    const result = filterRoutes(routes, 'GET')
    assert.deepEqual(result[0].params, ['id'])
    assert.deepEqual(result[1].params, ['username'])
    assert.deepEqual(result[2].params, [])
  })

  test('returns empty array when all routes are excluded', ({ assert }) => {
    const routes = [makeRoute(['GET'], 'admin.dashboard'), makeRoute(['GET'], 'api.users')]

    const result = filterRoutes(routes, 'GET', ['admin.', 'api.'])
    assert.lengthOf(result, 0)
  })

  test('returns empty array for empty input', ({ assert }) => {
    const result = filterRoutes([], 'GET')
    assert.lengthOf(result, 0)
  })

  test('default exclusions array is empty when not provided', ({ assert }) => {
    const routes = [makeRoute(['GET'], 'pages.show')]

    const result = filterRoutes(routes, 'GET')
    assert.lengthOf(result, 1)
  })
})
