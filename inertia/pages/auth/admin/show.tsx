import { ReactElement } from 'react'
import Layout from '~/layouts/admin'
import { Data } from '@generated/data'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { useMenu } from '~/hooks/use_admin'
import { CanAccess } from '~/guards/can_access'
import { Card } from '~/components/atoms/card'
import { Button } from '~/components/atoms/button'
import { Icon } from '~/components/atoms/icon'
import { Heading } from '~/components/atoms/heading'
import { StatusEnum, UserStatus } from '~/components/atoms/user_status'
import type { OAuthProvider } from '#types/auth'
import { getIcon } from '~/helpers/oauth'
import { capitalize } from '~/lib/string'
import { Separator } from '~/components/atoms/separator'
import type { AdminUsersShowTranslations } from '#types/translations'
import { Lang, useTranslation } from '~/hooks/use_translation'
import { usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'

type PageProps = {
  user: Data.User
  providers: OAuthProvider[]
  permissions: Data.Permission[]
  translations: AdminUsersShowTranslations
}

export default function UsersShowPage(props: PageProps) {
  const { user, providers, permissions, translations } = props
  const pageProps = usePage<SharedProps>().props
  const { t, format } = useTranslation(translations)

  const { getEntryIcon } = useMenu()

  const permissionsByCategory =
    permissions?.reduce<Record<string, Data.Permission[]>>((acc, permission: Data.Permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    }, {}) || {}

  return (
    <AdminMain
      title={t('title', { username: user.username })}
      icon={getEntryIcon('admin.users.render')}
    >
      <Card
        header={
          <div className="flex items-center justify-between gap-3">
            <CanAccess permission="users.view">
              <Button variant="icon" route="admin.users.render" title={t('title')} fitContent>
                <Icon name="ArrowLeft" />
              </Button>
            </CanAccess>
            <div className="flex gap-3">
              <CanAccess permission="users.update">
                <Button
                  variant="icon_warning"
                  route="admin.users_update.render"
                  routeParams={{ id: user.id }}
                  title={t('actions.edit', { username: user.username })}
                  fitContent
                >
                  <Icon name="Pen" size={18} />
                </Button>
              </CanAccess>
              <CanAccess permission="users.delete">
                <Button
                  variant="icon_danger"
                  route="admin.users.destroy"
                  routeParams={{ id: user.id }}
                  title={t('actions.delete', { username: user.username })}
                  fitContent
                >
                  <Icon name="Trash" size={18} />
                </Button>
              </CanAccess>
            </div>
          </div>
        }
      >
        <div className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
            <div className="grid gap-3">
              <Heading level={3}>{t('info.value')}</Heading>
              <Separator />
              <div className="grid">
                <span className="font-bold">{t('info.email')}</span>
                <span className="flex gap-2 items-center text-ink-muted">
                  {user.email}{' '}
                  <UserStatus
                    user={user.id}
                    status={user.status as StatusEnum}
                    translations={translations}
                  />
                </span>
              </div>
              <div className="grid">
                <span className="font-bold">{t('info.username')}</span>
                <span className="text-ink-muted">{user.username}</span>
              </div>
            </div>
            <div className="grid gap-3">
              <Heading level={3}>{t('history.value')}</Heading>
              <Separator />
              {user.createdAt && (
                <div className="grid">
                  <span className="font-bold">{t('history.created_at')}</span>
                  <span className="text-ink-muted">
                    {format(new Date(user.createdAt), 'medium', pageProps.locale as Lang)}
                  </span>
                </div>
              )}
              {user.updatedAt && (
                <div className="grid">
                  <span className="font-bold">{t('history.updated_at')}</span>
                  <span className="text-ink-muted">
                    {format(new Date(user.updatedAt), 'medium', pageProps.locale as Lang)}
                  </span>
                </div>
              )}
              {user.emailVerifiedAt && (
                <div className="grid">
                  <span className="font-bold">{t('history.verified_at')}</span>
                  <span className="text-ink-muted">
                    {format(new Date(user.emailVerifiedAt), 'medium', pageProps.locale as Lang)}
                  </span>
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <Heading level={3}>{t('providers.value')}</Heading>
              <Separator />
              {providers.map((provider) => {
                const isConnected = user.connectedProviders[provider]

                return (
                  <div key={provider} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      {getIcon(provider)}
                      <div>
                        <p className="text-sm font-medium text-ink">{capitalize(provider)}</p>
                        <p className={`text-xs ${isConnected ? 'text-success' : 'text-ink-muted'}`}>
                          {isConnected ? t('providers.connected') : t('providers.not_connected')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="grid gap-3">
            <Heading level={3}>{t('roles.value')}</Heading>
            <Separator />
            <div className="grid">
              <span className="font-bold">{t('roles.current')}</span>
              <span className="text-ink-muted">{t(user.role.name as any)}</span>
            </div>
            <span className="text-ink-muted">
              {t('permissions.value', {
                amount: `${user?.permissions?.length || 0}/${permissions.length}`,
              })}
            </span>
            {Object.keys(permissionsByCategory).length > 0 &&
              Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
                const ownedCount = categoryPermissions.filter((p) =>
                  user.permissions?.includes(p.slug)
                ).length

                return (
                  <div key={category} className="border border-edge rounded">
                    <span className="flex font-bold p-3">
                      {t(category as any)}{' '}
                      <span className="font-normal text-ink-muted ml-1">
                        ({' '}
                        <span
                          className={
                            ownedCount === categoryPermissions.length
                              ? 'text-success'
                              : 'text-warning'
                          }
                        >
                          {ownedCount}
                        </span>
                        /{categoryPermissions.length})
                      </span>
                    </span>
                    <div className="p-3 grid gap-2">
                      {categoryPermissions.map((permission) => {
                        const hasPermission = user.permissions?.includes(permission.slug)
                        return (
                          <span
                            key={permission.slug}
                            className={`flex gap-2 items-center text-ink-muted ${hasPermission ? '' : 'opacity-40'}`}
                          >
                            <Icon
                              name={hasPermission ? 'Check' : 'X'}
                              className={hasPermission ? 'text-success' : 'text-ink-subtle'}
                              size={16}
                            />
                            <span className={hasPermission ? '' : 'text-ink-muted'}>
                              {t(permission.name as any)}
                            </span>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </Card>
    </AdminMain>
  )
}

UsersShowPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
