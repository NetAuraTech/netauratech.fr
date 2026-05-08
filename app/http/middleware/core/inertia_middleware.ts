import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import UserTransformer from '#transformers/user_transformer'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'
import { inject } from '@adonisjs/core'
import PreferencesService from '#services/preferences/preference_service'
import { DEFAULT_PREFERENCES } from '#types/preferences'
import env from '#start/env'
import { CmsTranslations, CommonTranslations } from '#types/translations'

@inject()
export default class InertiaMiddleware extends BaseInertiaMiddleware {
  constructor(private preferencesService: PreferencesService) {
    super()
  }

  async share(ctx: HttpContext) {
    /**
     * The share method is called everytime an Inertia page is rendered. In
     * certain cases, a page may get rendered before the session middleware
     * or the auth middleware are executed. For example: During a 404 request.
     *
     * In that case, we must always assume that HttpContext is not fully hydrated
     * with all the properties
     */
    const { session, auth } = ctx as Partial<HttpContext>

    const user = auth?.user

    await user?.load((loader) => {
      loader.load('role', (role) => {
        role.preload('permissions')
      })
    })

    /**
     * Fetching the first error from the flash messages
     */
    const errorsBag = session?.flashMessages.get('errorsBag') ?? {}
    const errorFromBag: string | undefined = Object.keys(errorsBag)
      .filter((code) => code !== 'E_VALIDATION_ERROR')
      .map((code) => errorsBag[code])[0]

    const success: string | undefined = session?.flashMessages.get('success')
    const info: string | undefined = session?.flashMessages.get('info')
    const error: string | undefined = session?.flashMessages.get('error') || errorFromBag

    const preferences = ctx.inertia.always(
      user ? await this.preferencesService.get(user) : DEFAULT_PREFERENCES
    )

    const routeName = ctx.route?.name ?? ''
    const isCms = routeName.startsWith('admin.') || routeName.startsWith('cms.')

    /**
     * Data shared with all Inertia pages. Make sure you are using
     * transformers for rich data-types like Models.
     */
    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      flash: ctx.inertia.always({
        error,
        success,
        info,
      }),
      currentUser: ctx.inertia.always(user ? UserTransformer.transform(user) : undefined),
      preferences,
      csrfToken: ctx.request.csrfToken,
      app_name: env.get('APP_NAME'),
      app_url: env.get('APP_URL'),
      email: env.get('MAIL_FROM_ADDRESS'),
      common_translations: {
        pagination: {
          showing: ctx.i18n.t('pagination.showing', {
            start: '{start}',
            end: '{end}',
            total: '{total}',
          }),
          previous: ctx.i18n.t('pagination.previous'),
          next: ctx.i18n.t('pagination.next'),
        },
        validation: {
          required: ctx.i18n.t('validation.front.required', { field: '{field}' }),
          email: ctx.i18n.t('validation.front.email'),
          min_length: ctx.i18n.t('validation.front.min_length', {
            field: '{field}',
            min: '{min}',
            current: '{current}',
          }),
          max_length: ctx.i18n.t('validation.front.max_length', {
            field: '{field}',
            max: '{max}',
            current: '{current}',
          }),
          matches: ctx.i18n.t('validation.front.matches', { other: '{other}' }),
          one_of: ctx.i18n.t('validation.front.one_of', { field: '{field}' }),
        },
      } as CommonTranslations,
      cms_translations: isCms
        ? ({
            category: {
              access_control: ctx.i18n.t('cms.category.access_control'),
              main: ctx.i18n.t('cms.category.main'),
              content: ctx.i18n.t('cms.category.content'),
            },
            dashboard: ctx.i18n.t('cms.dashboard'),
            pages: ctx.i18n.t('cms.pages.value'),
            templates: ctx.i18n.t('cms.templates.value'),
            users: ctx.i18n.t('cms.users.value'),
            files: ctx.i18n.t('cms.files.value'),
          } as CmsTranslations)
        : undefined,
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)

    const output = await next()
    this.dispose(ctx)

    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>
  export interface SharedProps extends MiddlewareSharedProps {}
}
