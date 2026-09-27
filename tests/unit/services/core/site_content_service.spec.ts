import { test } from '@japa/runner'
import { SiteContentService } from '#services/core/site_content_service'

/**
 * Unit tests for `SiteContentService`.
 *
 * The service reads the committed markdown sources in `content/`, so these
 * tests assert the parsed catalogue against the actual site content.
 */
test.group('SiteContentService', () => {
  test('resolves the three services in frontmatter order', async ({ assert }) => {
    const service = new SiteContentService()

    const { services } = await service.getHomeContent()

    assert.lengthOf(services, 3)
    assert.deepEqual(
      services.map((entry) => entry.rubrique),
      ['Sites vitrines', 'Boutiques en ligne', 'Applications web']
    )
    assert.isAtLeast(services[0].items.length, 1)
    assert.isNotEmpty(services[0].description)
  })

  test('resolves the three newest projects for the home page', async ({ assert }) => {
    const service = new SiteContentService()

    const { projects } = await service.getHomeContent()

    assert.lengthOf(projects, 3)
    assert.deepEqual(
      projects.map((project) => project.title),
      ['Floralia Atelier', 'AdonisJS Foundry', 'NetAuraCMS']
    )
    assert.deepEqual(
      projects.map((project) => project.slug),
      ['floralia-atelier', 'adonisjs-foundry', 'netauracms']
    )
    for (const project of projects) {
      assert.isNumber(project.cover)
      assert.isAbove(project.cover, 0)
      assert.isNotEmpty(project.rubrique)
      assert.isNotEmpty(project.note)
      assert.isNotEmpty(project.blocks)
      assert.isArray(project.blocks)
    }
  })

  test('getProjects returns the full portfolio newest-first', async ({ assert }) => {
    const service = new SiteContentService()

    const projects = await service.getProjects()

    assert.lengthOf(projects, 7)
    assert.deepEqual(
      projects.map((project) => project.title),
      [
        'Floralia Atelier',
        'AdonisJS Foundry',
        'NetAuraCMS',
        'VapeHouse',
        'November',
        'Lille Karting',
        'Le Relais de Saint-Jacques',
      ]
    )
  })

  test('getServices returns offers with the Inclus and Tarif facts split out', async ({
    assert,
  }) => {
    const service = new SiteContentService()

    const services = await service.getServices()

    assert.lengthOf(services, 3)
    for (const serviceEntry of services) {
      assert.isNotEmpty(serviceEntry.rubrique)
      assert.isNotEmpty(serviceEntry.description)
      assert.isNotEmpty(serviceEntry.inclus)
      assert.isNotEmpty(serviceEntry.tarif)
      assert.isFalse(serviceEntry.description.includes('Inclus'))
      assert.isFalse(serviceEntry.description.includes('Tarif'))
    }
  })

  test('getProjectBySlug resolves each project from its content source', async ({ assert }) => {
    const service = new SiteContentService()

    const foundry = await service.getProjectBySlug('adonisjs-foundry')
    assert.equal(foundry.slug, 'adonisjs-foundry')
    assert.equal(foundry.title, 'AdonisJS Foundry')
    assert.isNotEmpty(foundry.blocks)

    const cms = await service.getProjectBySlug('netauracms')
    assert.equal(cms.title, 'NetAuraCMS')

    const vapehouse = await service.getProjectBySlug('vapehouse')
    assert.equal(vapehouse.title, 'VapeHouse')
  })

  test('getProjectBySlug throws a 404 tagged error for an unknown or unsafe slug', async ({
    assert,
  }) => {
    const service = new SiteContentService()

    for (const slug of ['missing-project', '../../secret']) {
      let error: unknown
      try {
        await service.getProjectBySlug(slug)
        assert.fail('expected getProjectBySlug to throw')
      } catch (caught) {
        error = caught
      }

      assert.instanceOf(error, Error)
      assert.equal((error as { code: string }).code, 'E_PROJECT_NOT_FOUND')
      assert.equal((error as { status: number }).status, 404)
    }
  })
})
