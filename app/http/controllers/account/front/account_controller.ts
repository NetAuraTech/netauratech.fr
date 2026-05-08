import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import {
  deleteAccountValidator,
  updateEmailValidator,
  updatePasswordValidator,
} from '#validators/account'
import { Exception } from '@adonisjs/core/exceptions'
import { regenerateCsrfToken } from '#helpers/auth/crsf'
import { enabledProviders } from '#helpers/auth/oauth'
import UserTransformer from '#transformers/user_transformer'
import { AccountService } from '#services/account/account_service'

@inject()
export default class AccountController {
  constructor(protected accountService: AccountService) {}

  async render(ctx: HttpContext) {
    const { inertia, auth, i18n } = ctx

    const user = auth.user!

    return inertia.render('settings/account/front/index', {
      user: UserTransformer.transform(user),
      providers: enabledProviders,
      translations: {
        header: {
          title: i18n.t('settings.title'),
          sub_title: i18n.t('settings.sub_title'),
          tabs: {
            profile: i18n.t('settings.profile.value'),
            account: i18n.t('settings.account.value'),
            preferences: i18n.t('settings.preferences.value'),
            admin: i18n.t('cms.value'),
            logout: i18n.t('auth.session.logout.value'),
          },
        },
        email: {
          title: i18n.t('settings.account.email.title'),
          sub_title: i18n.t('settings.account.email.sub_title'),
          submit: i18n.t('settings.account.email.submit'),
          placeholder: i18n.t('settings.account.email.placeholder'),
          value: i18n.t('settings.account.email.value'),
          change: {
            title: i18n.t('settings.account.email.change.title'),
            sub_title: i18n.t('settings.account.email.change.sub_title'),
            submit: i18n.t('settings.account.email.change.submit'),
            cancel: i18n.t('settings.account.email.change.cancel'),
            info: {
              title: i18n.t('settings.account.email.change.info.title'),
              message: i18n.t('settings.account.email.change.info.message'),
            },
          },
        },
        oauth: {
          title: i18n.t('settings.account.oauth.title'),
          sub_title: i18n.t('settings.account.oauth.sub_title'),
          connected: i18n.t('settings.account.oauth.connected'),
          not_connected: i18n.t('settings.account.oauth.not_connected'),
          link: i18n.t('settings.account.oauth.link'),
          unlink: {
            confirm: i18n.t('settings.account.oauth.unlink.confirm', { provider: '{provider}' }),
            value: i18n.t('settings.account.oauth.unlink.value'),
          },
        },
        password: {
          title: i18n.t('settings.account.password.title'),
          sub_title: i18n.t('settings.account.password.sub_title'),
          submit: i18n.t('settings.account.password.submit'),
          current: {
            value: i18n.t('settings.account.password.current.value'),
          },
          confirm: {
            help: i18n.t('settings.account.password.confirm.help'),
            value: i18n.t('settings.account.password.confirm.value'),
          },
          new: {
            help: i18n.t('settings.account.password.new.help'),
            value: i18n.t('settings.account.password.new.value'),
          },
        },
        delete: {
          title: i18n.t('settings.account.delete.title'),
          sub_title: i18n.t('settings.account.delete.sub_title'),
          submit: i18n.t('settings.account.delete.submit'),
          cancel: i18n.t('settings.account.delete.cancel'),
          password: i18n.t('settings.account.delete.password'),
          confirm: {
            title: i18n.t('settings.account.delete.confirm.title'),
            sub_title: i18n.t('settings.account.delete.confirm.sub_title'),
          },
        },
      },
    })
  }

  async execute(ctx: HttpContext) {
    const { auth, request, response, session, i18n } = ctx

    const action = request.input('_action')

    const user = auth.getUserOrFail()

    switch (action) {
      case 'update_email': {
        const payload = await updateEmailValidator(user.id).validate(request.all())

        const updated = await this.accountService.update(user, payload)

        regenerateCsrfToken(ctx)

        if (payload.email === updated.pendingEmail) {
          session.flash('success', i18n.t('settings.account.success'))
        }

        return response.redirect().toRoute('settings.account.render')
      }
      case 'update_password': {
        const payload = await updatePasswordValidator.validate(request.all())

        await this.accountService.update(user, payload)

        regenerateCsrfToken(ctx)

        session.flash('success', i18n.t('settings.account.password.success'))

        return response.redirect().toRoute('settings.account.render')
      }
      default:
        throw new Exception('', { status: 400 })
    }
  }

  async destroy(ctx: HttpContext) {
    const { auth, request, response, session, i18n } = ctx

    const user = auth.getUserOrFail()

    const payload = await deleteAccountValidator.validate(request.all())

    await this.accountService.delete(user, payload)

    await auth.use('web').logout()

    session.flash('success', i18n.t('settings.password.delete.success'))

    return response.redirect().toRoute('auth.session.render')
  }
}
