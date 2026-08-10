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
import { Paragraph } from '~/components/atoms/paragraph'
import { useFormValidation } from '~/hooks/use_form_validation'
import { rules } from '~/helpers/validation_rules'
import { Field } from '~/components/molecules/field'
import { Checkbox } from '~/components/atoms/checkbox'
import { useTranslation } from '~/hooks/use_translation'
import { permissionCategoryKey } from '~/helpers/permissions'
import type { AdminRolesFormTranslations } from '#types/translations'
import { Form } from '@adonisjs/inertia/react'
import { SharedProps } from '@adonisjs/inertia/types'

type PageProps = {
  role: Data.Role | null
  permissions: Data.Permission[]
  translations: AdminRolesFormTranslations
}

export default function RolesFormPage(props: PageProps) {
  const { role, permissions, translations } = props
  const { t } = useTranslation(translations)

  const isEditing = role !== null

  const { getEntryIcon } = useMenu()

  const validation = useFormValidation({
    name: [
      rules.required(t('name.value')),
      rules.minLength(2, t('name.value')),
      rules.maxLength(100, t('name.value')),
    ],
    slug: [
      rules.required(t('slug.value')),
      rules.minLength(2, t('slug.value')),
      rules.maxLength(50, t('slug.value')),
      rules.pattern(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, 'slug_format'),
    ],
    description: [rules.maxLength(255, t('description.value'))],
  })

  const assignedPermissionIds = new Set(
    (role?.permissions ?? []).map((permission) => permission.id)
  )

  const permissionsByCategory = permissions.reduce<Record<string, Data.Permission[]>>(
    (acc, permission) => {
      const category = permissionCategoryKey(permission.category)
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(permission)
      return acc
    },
    {}
  )

  return (
    <AdminMain
      title={isEditing ? t('title.edit', { name: role.name }) : t('title.create')}
      icon={getEntryIcon('admin.roles.render')}
    >
      <Card
        header={
          <div className="flex items-center justify-between gap-3">
            <CanAccess permission="roles.view">
              <Button
                variant="icon"
                route="admin.roles.render"
                title={t('actions.list')}
                fitContent
              >
                <Icon name="ArrowLeft" />
              </Button>
            </CanAccess>
          </div>
        }
      >
        <Form
          route={isEditing ? 'admin.roles_update.execute' : 'admin.roles_create.execute'}
          routeParams={isEditing ? { id: role.id } : {}}
          className="grid gap-6"
          onBefore={(visit) => {
            const isValid = validation.validateAll(visit.data as Record<string, any>)
            if (!isValid) return false
          }}
        >
          {({ errors, processing }) => (
            <>
              <Field
                label={t('name.value')}
                name="name"
                type="text"
                defaultValue={role?.name}
                placeholder={t('name.placeholder')}
                errorMessage={errors.name || validation.getValidationMessage('name')}
                onChange={(event) => {
                  validation.handleChange('name', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('name', event!.target.value)
                }}
                required
                sanitize
              />
              <Field
                label={t('slug.value')}
                name="slug"
                type="text"
                defaultValue={role?.slug}
                placeholder={t('slug.placeholder')}
                errorMessage={errors.slug || validation.getValidationMessage('slug')}
                onChange={(event) => {
                  validation.handleChange('slug', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('slug', event!.target.value)
                }}
                required
                sanitize
              />
              <Field
                label={t('description.value')}
                name="description"
                type="textarea"
                defaultValue={role?.description ?? ''}
                placeholder={t('description.placeholder')}
                errorMessage={errors.description || validation.getValidationMessage('description')}
                onChange={(event) => {
                  validation.handleChange('description', event.target.value)
                }}
                onBlur={(event) => {
                  validation.handleBlur('description', event!.target.value)
                }}
              />
              <div className="grid gap-3">
                <Heading level={3}>{t('permissions.value')}</Heading>
                <div className="grid gap-4">
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                    <fieldset key={`category-${category}`} className="grid gap-2">
                      <legend className="font-semibold">
                        {t(`permissions.categories.${category}` as any)}
                      </legend>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {categoryPermissions.map((permission) => (
                          /*
                           * Implicit label association: the Checkbox atom forces
                           * `id = name`, so per-item `htmlFor` is impossible when
                           * several checkboxes share the `permission_ids[]` name
                           * (bracket notation is required for Inertia to collect
                           * the values into an array).
                           */
                          <label
                            key={`permission-${permission.id}`}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              name="permission_ids[]"
                              value={permission.id}
                              checked={assignedPermissionIds.has(permission.id)}
                            />
                            <span>{t(`permissions.items.${permission.slug}.value` as any)}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
                <Paragraph className="text-ink-muted text-sm">
                  {t('permissions.system_hint')}
                </Paragraph>
              </div>
              <Button loading={processing} type={'submit'} fitContent>
                {t('submit')}
              </Button>
            </>
          )}
        </Form>
      </Card>
    </AdminMain>
  )
}

RolesFormPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
