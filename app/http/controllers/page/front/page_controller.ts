import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PageService } from '#services/page/page_service'
import { StorageService } from '#services/file/storage_service'
import { PageResolverService } from '#services/page/page_resolver_service'
import { CacheService } from '#services/cache/cache_service'
import { ResolvedPageContent } from '#types/page'

@inject()
export default class PageController {
  constructor(
    protected pageService: PageService,
    protected resolverService: PageResolverService,
    protected storageService: StorageService,
    protected cache: CacheService
  ) {}

  /**
   * Renders the homepage — the page flagged as `is_homepage = true`.
   * Called by `GET /`.
   */
  async home(ctx: HttpContext) {
    const { inertia, request, response } = ctx

    const locale: string = request.input('locale', ctx.i18n?.locale ?? 'en')

    const page = await this.pageService.findHomepage()

    if (!page) {
      return response.notFound()
    }

    const translation = page.translationFor(locale) ?? page.translationFor(page.defaultLocale)

    if (!translation || translation.status !== 'published') {
      return response.notFound()
    }

    const cacheKey = `page_render:home:${page.id}:${translation.locale}:${translation.updatedAt!.toMillis()}`

    const resolvedContent = await this.cache.remember<ResolvedPageContent>(
      cacheKey,
      async () => {
        return await this.resolverService.resolve(translation.content, translation.locale)
      },
      3600
    )

    let metaImageUrl: string | null = null
    if (page.metaImage) {
      metaImageUrl = await this.storageService.url(page.metaImage.path, page.metaImage.disk)
    }

    return (inertia.render as any)('page/front/show', {
      id: page.id,
      locale,
      title: translation.title,
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      metaImage: metaImageUrl,
      content: resolvedContent,
    })
  }

  /**
   * Renders a published page by its slug.
   * The locale is resolved from the URL param, then the request locale,
   * then the page's default locale — in that priority order.
   * Returns 404 when the slug doesn't exist or the matching translation
   * is not in `published` status.
   */
  async render(ctx: HttpContext) {
    const { inertia, params, request, response } = ctx

    const page = await this.pageService.findBySlug(params.slug)

    if (!page) {
      return response.notFound()
    }

    const locale: string = params.locale ?? (request as any).locale ?? page.defaultLocale
    const translation = page.translationFor(locale)

    if (!translation || translation.status !== 'published') {
      return response.notFound()
    }

    const cacheKey = `page_render:${page.id}:${locale}:${translation.updatedAt!.toMillis()}`

    const resolvedContent = await this.cache.remember<ResolvedPageContent>(
      cacheKey,
      async () => {
        return await this.resolverService.resolve(translation.content, locale)
      },
      3600
    )

    // Resolve the og:image if set on the page
    let metaImageUrl: string | null = null
    if (page.metaImage) {
      metaImageUrl = await this.storageService.url(page.metaImage.path, page.metaImage.disk)
    }

    return (inertia.render as any)('page/front/show', {
      id: page.id,
      locale,
      title: translation.title,
      metaTitle: translation.metaTitle,
      metaDescription: translation.metaDescription,
      metaImage: metaImageUrl,
      content: resolvedContent,
    })
  }

  /**
   * Generates and serves the XML sitemap for search engines.
   */
  async sitemap({ response }: HttpContext) {
    const xml = await this.pageService.generateSitemap()

    return response
      .header('Content-Type', 'application/xml')
      .header('Cache-Control', 'public, max-age=3600')
      .send(xml)
  }

  /**
   * Generates and serves the robots.txt configuration file.
   */
  async robots({ response }: HttpContext) {
    const robotsTxt = this.pageService.getRobotsTxt()

    return response.header('Content-Type', 'text/plain').send(robotsTxt)
  }
}
