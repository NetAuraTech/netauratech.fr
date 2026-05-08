import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { PageService } from '#services/page/page_service'
import { PageResolverService } from '#services/page/page_resolver_service'
import vine from '@vinejs/vine'
import env from '#start/env'
import PageTranslationTransformer from '#transformers/page_translation_transformer'
import { BuilderSessionService } from '#services/page/builder_session_service'
import { PageContent } from '#types/page'

const previewParamsValidator = vine.create({
  pageId: vine.number().positive(),
  locale: vine.string().trim().maxLength(10),
  token: vine.string().trim(),
  translationId: vine.number().positive().optional(),
})

/** Token validity window in seconds */
const TOKEN_TTL_S = 300

/**
 * Generates a short-lived HMAC token for iframe preview access.
 * Called from `edit.tsx` before rendering the iframe.
 *
 * @param pageId  - Page being previewed
 * @param userId  - Authenticated editor's ID
 * @param locale  - Locale being previewed
 */
export function generatePreviewToken(pageId: number, userId: number, locale: string): string {
  const expires = Math.floor(Date.now() / 1000) + TOKEN_TTL_S
  const payload = `${pageId}:${userId}:${locale}:${expires}`
  const secret = env.get('APP_KEY')
  const sig = createHmac('sha256', secret.release()).update(payload).digest('hex')
  return `${expires}.${sig}`
}

/**
 * Validates a preview token against the expected HMAC.
 * Returns `null` on invalid / expired token.
 */
function validatePreviewToken(
  token: string,
  pageId: number,
  userId: number,
  locale: string
): boolean {
  const [expiresStr, sig] = token.split('.')
  if (!expiresStr || !sig) return false

  const expires = Number(expiresStr)
  if (Number.isNaN(expires) || Math.floor(Date.now() / 1000) > expires) return false

  const payload = `${pageId}:${userId}:${locale}:${expires}`
  const secret = env.get('APP_KEY')
  const expected = createHmac('sha256', secret.release()).update(payload).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

@inject()
export default class PagesPreviewController {
  constructor(
    protected pageService: PageService,
    protected sessionService: BuilderSessionService,
    protected resolverService: PageResolverService
  ) {}

  /**
   * Generates and returns a short-lived preview token for the current user.
   * Called via `GET /api/admin/page/preview/token?pageId=:id&locale=:locale`
   * so the editor can embed the token in the iframe URL without exposing
   * the signing secret to the client.
   */
  async token(ctx: HttpContext) {
    const { request, response, auth } = ctx

    const user = auth.getUserOrFail()
    const pageId = Number(request.input('pageId'))
    const locale = String(request.input('locale', 'en'))

    if (!pageId || Number.isNaN(pageId)) {
      return response.badRequest({
        error: { code: 'E_INVALID_PARAMS', message: 'pageId is required' },
      })
    }

    const token = generatePreviewToken(pageId, user.id, locale)
    return response.ok({ token })
  }

  /**
   * Renders the preview page inside the builder iframe.
   *
   * Validates the HMAC token, loads the translation (draft included — this
   * is the whole point of the preview route), resolves file refs, and
   * renders `page/preview` with `editable: true` so the React page can
   * initialise the Transmit SSE listener.
   *
   * Route: GET /admin/pages/preview/:pageId?locale=en&token=xxx
   */
  async render(ctx: HttpContext) {
    const { inertia, params, request, response, auth } = ctx

    const user = auth.getUserOrFail()

    const payload = await previewParamsValidator.validate({
      pageId: params.pageId,
      locale: request.input('locale', 'en'),
      token: request.input('token', ''),
    })

    if (!validatePreviewToken(payload.token, payload.pageId, user.id, payload.locale)) {
      return response.unauthorized({
        error: { code: 'E_INVALID_TOKEN', message: 'Preview token is invalid or expired.' },
      })
    }

    const page = await this.pageService.detail(payload.pageId)
    const translation = page.translationFor(payload.locale)

    if (!translation) {
      return response.notFound()
    }

    const draftTranslationId = payload.translationId ?? translation.id
    const draft = await this.sessionService.getDraft<PageContent>(draftTranslationId)
    const contentToRender = draft ?? translation.content

    translation.resolved_content = await this.resolverService.resolve(
      contentToRender,
      payload.locale
    )

    return inertia.render('page/front/preview', {
      page: PageTranslationTransformer.transform(translation),
      editable: true,
    })
  }
}
