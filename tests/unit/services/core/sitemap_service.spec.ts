import { test } from '@japa/runner'
import env from '#start/env'
import sitemapConfig from '#config/sitemap'
import { SitemapRegistry } from '#services/core/sitemap_registry'
import { SitemapService } from '#services/core/sitemap_service'
import type { SitemapContributor } from '#types/sitemap'

/**
 * Unit tests for `SitemapService`.
 *
 * The service is exercised at its public `generate()` / `buildXml()` seam
 * against hand-registered stub contributors and a mutated config object, so the
 * aggregation, deduplication, additions, exclusions, and XML envelope rules
 * are verified without touching the router or the database.
 */
test.group('SitemapService', (group) => {
  const baseAdditions = [...sitemapConfig.manualAdditions]
  const baseExclusions = [...sitemapConfig.exclusions]

  group.each.setup(() => {
    sitemapConfig.manualAdditions.length = 0
    sitemapConfig.manualAdditions.push(...baseAdditions)
    sitemapConfig.exclusions.length = 0
    sitemapConfig.exclusions.push(...baseExclusions)
  })

  const stubContributor = (name: string, urls: string[]): SitemapContributor => ({
    name,
    async collect() {
      return urls
    },
  })

  const registryWith = (...contributors: SitemapContributor[]): SitemapRegistry => {
    const registry = new SitemapRegistry()
    for (const contributor of contributors) {
      registry.register(contributor.name, async () => contributor)
    }
    return registry
  }

  // ─── buildXml() ───────────────────────────────────────────────────────────

  test('buildXml() returns a valid empty urlset for no URLs', async ({ assert }) => {
    const service = new SitemapService(registryWith())

    const xml = service.buildXml([])

    assert.include(xml, '<?xml version="1.0" encoding="UTF-8"?>')
    assert.include(xml, '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    assert.include(xml, '</urlset>')
    assert.notInclude(xml, '<url>')
  })

  test('buildXml() emits a <url><loc> entry per URL', async ({ assert }) => {
    const service = new SitemapService(registryWith())

    const xml = service.buildXml(['http://localhost:3334/about', 'http://localhost:3334/contact'])

    assert.include(xml, '<loc>http://localhost:3334/about</loc>')
    assert.include(xml, '<loc>http://localhost:3334/contact</loc>')
  })

  test('buildXml() XML-escapes ampersands and angle brackets in URLs', async ({ assert }) => {
    const service = new SitemapService(registryWith())

    const xml = service.buildXml(['http://localhost:3334/search?a=1&b=2'])

    assert.include(xml, '<loc>http://localhost:3334/search?a=1&amp;b=2</loc>')
    assert.notInclude(xml, '&b=2</loc>')
  })

  // ─── generate() aggregation ───────────────────────────────────────────────

  test('generate() merges entries from multiple contributors into one document', async ({
    assert,
  }) => {
    const service = new SitemapService(
      registryWith(
        stubContributor('routes', ['http://localhost:3334/about']),
        stubContributor('page', ['http://localhost:3334/fr/a-propos'])
      )
    )

    const xml = await service.generate()

    assert.include(xml, '<loc>http://localhost:3334/about</loc>')
    assert.include(xml, '<loc>http://localhost:3334/fr/a-propos</loc>')
  })

  test('generate() yields a valid empty urlset when no contributor is registered', async ({
    assert,
  }) => {
    const service = new SitemapService(registryWith())

    const xml = await service.generate()

    assert.notInclude(xml, '<url>')
    assert.include(xml, '</urlset>')
  })

  test('generate() deduplicates the same URL contributed twice', async ({ assert }) => {
    const service = new SitemapService(
      registryWith(
        stubContributor('routes', ['http://localhost:3334/about']),
        stubContributor('page', ['http://localhost:3334/about'])
      )
    )

    const xml = await service.generate()

    assert.equal((xml.match(/<loc>http:\/\/localhost:3334\/about<\/loc>/g) || []).length, 1)
  })

  // ─── manual additions ─────────────────────────────────────────────────────

  test('generate() injects absolute manual additions', async ({ assert }) => {
    sitemapConfig.manualAdditions.push('https://external.example.com/landing')
    const service = new SitemapService(registryWith())

    const xml = await service.generate()

    assert.include(xml, '<loc>https://external.example.com/landing</loc>')
  })

  test('generate() resolves root-relative manual additions against the app URL', async ({
    assert,
  }) => {
    sitemapConfig.manualAdditions.push('/search')
    const service = new SitemapService(registryWith())

    const xml = await service.generate()

    assert.include(xml, `<loc>${env.get('APP_URL')}/search</loc>`)
  })

  // ─── exclusions ───────────────────────────────────────────────────────────

  test('generate() excludes a contributed URL by path', async ({ assert }) => {
    sitemapConfig.exclusions.push('/about')
    const service = new SitemapService(
      registryWith(stubContributor('routes', ['http://localhost:3334/about']))
    )

    const xml = await service.generate()

    assert.notInclude(xml, '<loc>http://localhost:3334/about</loc>')
  })

  test('generate() excludes a contributed URL by absolute URL', async ({ assert }) => {
    sitemapConfig.exclusions.push('http://localhost:3334/about')
    const service = new SitemapService(
      registryWith(stubContributor('routes', ['http://localhost:3334/about']))
    )

    const xml = await service.generate()

    assert.notInclude(xml, '<loc>http://localhost:3334/about</loc>')
  })

  test('exclusions win over manual additions', async ({ assert }) => {
    sitemapConfig.manualAdditions.push('http://localhost:3334/about')
    sitemapConfig.exclusions.push('/about')
    const service = new SitemapService(registryWith())

    const xml = await service.generate()

    assert.notInclude(xml, '<loc>http://localhost:3334/about</loc>')
  })
})
