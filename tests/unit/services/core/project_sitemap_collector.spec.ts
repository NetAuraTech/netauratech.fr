import { test } from '@japa/runner'
import env from '#start/env'
import { SiteContentService } from '#services/core/site_content_service'
import { ProjectSitemapCollector } from '#services/core/project_sitemap_collector'

/**
 * Unit tests for `ProjectSitemapCollector`.
 *
 * The contributor enumerates the committed project sources in `content/projects/`
 * into the `/projets/{slug}` single-page URLs the route collector skips.
 */
test.group('ProjectSitemapCollector', () => {
  test('collects one absolute URL per project single page', async ({ assert }) => {
    const collector = new ProjectSitemapCollector(new SiteContentService())

    const urls = await collector.collect()

    const baseUrl = env.get('APP_URL')
    assert.sameMembers(urls, [
      `${baseUrl}/projets/floralia-atelier`,
      `${baseUrl}/projets/adonisjs-foundry`,
      `${baseUrl}/projets/netauracms`,
      `${baseUrl}/projets/vapehouse`,
      `${baseUrl}/projets/november`,
      `${baseUrl}/projets/lille-karting`,
      `${baseUrl}/projets/le-relais-de-saint-jacques`,
    ])
  })

  test('returns the contributor name "projects"', ({ assert }) => {
    const collector = new ProjectSitemapCollector(new SiteContentService())

    assert.equal(collector.name, 'projects')
  })
})
