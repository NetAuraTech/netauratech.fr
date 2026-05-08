import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { UserService } from '#services/auth/user_service'
import { deleteValidator, listValidator } from '#validators/user'
import { RoleService } from '#services/auth/role_service'
import UserTransformer from '#transformers/user_transformer'
import RoleTransformer from '#transformers/role_transformer'
import { stripEmptyStrings } from '#helpers/core/strip_empty_strings'
import { extractPagination } from '#helpers/pagination/extract_pagination'
import { TranslationNodes } from '#types/translations'

@inject()
export default class UsersController {
  constructor(
    protected userService: UserService,
    protected roleService: RoleService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, request, i18n } = ctx

    const pagination = await extractPagination(request)

    const roles = await this.roleService.findAll()
    const allowed = roles.map((role) => String(role.id))

    const data = stripEmptyStrings(request.all())

    const payload = await listValidator(allowed).validate(data)

    const users = await this.userService.list(payload, pagination)

    return inertia.render('auth/cms/index', {
      users: UserTransformer.paginate(users.all(), users.getMeta()),
      roles: RoleTransformer.transform(roles),
      filters: payload,
      translations: {
        title: i18n.t('cms.users.list.title'),
        action: i18n.t('cms.users.list.action'),
        search: {
          value: i18n.t('cms.users.search.value'),
          placeholder: i18n.t('cms.users.search.placeholder'),
          filter: i18n.t('cms.users.search.filter'),
        },
        roles: {
          value: i18n.t('cms.users.roles.value'),
          placeholder: i18n.t('cms.users.roles.placeholder'),
          ...roles.reduce((acc, role) => {
            acc[role.slug] = {
              value: i18n.t(`cms.users.roles.${role.slug}.value`),
              description: i18n.t(`cms.users.roles.${role.slug}.description`),
            }
            return acc
          }, {} as TranslationNodes),
        },
        status: {
          verified: i18n.t('cms.users.status.verified'),
          unverified: i18n.t('cms.users.status.unverified'),
          pending_invite: i18n.t('cms.users.status.pending_invite'),
          value: i18n.t('cms.users.status.value'),
        },
        empty: i18n.t('cms.users.list.empty'),
        register_on: i18n.t('cms.users.list.register_on'),
        value: i18n.t('cms.users.value'),
        value_one: i18n.t('cms.users.value_one'),
        actions: {
          value: i18n.t('cms.users.actions'),
          show: i18n.t('cms.users.show.title', { username: '{username}' }),
          edit: i18n.t('cms.users.edit.title', { username: '{username}' }),
          delete: i18n.t('cms.users.delete.title', { username: '{username}' }),
        },
      },
    })
  }

  async destroy(ctx: HttpContext) {
    const { response, params, session, i18n } = ctx

    const payload = await deleteValidator.validate(params)

    await this.userService.delete(payload.id)

    session.flash('success', i18n.t('cms.users.deleted'))

    return response.redirect().toRoute('admin.users.render')
  }
}
