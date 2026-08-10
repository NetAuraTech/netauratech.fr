import { Card } from '~/components/atoms/card'
import { Heading } from '~/components/atoms/heading'
import { Paragraph } from '~/components/atoms/paragraph'
import { Field } from '~/components/molecules/field'
import { Button } from '~/components/atoms/button'
import { Badge } from '~/components/atoms/badge'
import { Label } from '~/components/atoms/label'
import { Form } from '@adonisjs/inertia/react'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { useTranslation } from '~/hooks/use_translation'
import type { AdminMaintenanceTranslations } from '#types/translations'
import Layout from '~/layouts/admin'
import { ReactElement } from 'react'
import { SharedProps } from '@adonisjs/inertia/types'
import type { MaintenanceConfig } from '#types/maintenance'

type MemoryConfigDto = {
  enabled: boolean
  message: string
  allowedIps: string[]
  retryAfter?: number
  updatedAt: string
}

interface PageProps {
  config: MaintenanceConfig
  effectiveEnabled?: boolean
  memoryConfig?: MemoryConfigDto
  redisAvailable?: boolean
  source?: 'redis' | 'memory'
  translations: AdminMaintenanceTranslations
}

/**
 * Convert an ISO 8601 timestamp to the value expected by a `datetime-local`
 * input (local time, `YYYY-MM-DDTHH:mm`). Returns an empty string when the
 * timestamp is missing or invalid.
 */
function toDatetimeLocal(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T')
}

export default function MaintenancePage(props: PageProps) {
  const { config, effectiveEnabled, memoryConfig, redisAvailable, source, translations } = props

  const { t } = useTranslation(translations)

  const validation = useFormValidation({
    message: presets.requiredString(t('message.value')),
  })

  const getStatusBadge = () => {
    if (!effectiveEnabled) {
      return <Badge variant="success">{t('status.inactive')}</Badge>
    }
    if (source === 'redis') {
      return <Badge variant="danger">{t('status.active_redis')}</Badge>
    }
    return <Badge variant="warning">{t('status.active_memory')}</Badge>
  }

  const getSourceText = () => {
    if (!redisAvailable && source === 'memory') {
      return t('source.memory_warning')
    }
    return source === 'redis' ? t('source.redis') : t('source.memory')
  }

  return (
    <AdminMain title={t('title')} icon="Wrench">
      <Card>
        <div className="grid gap-6">
          {/* Status Display */}
          <div className="flex items-center gap-4 flex-wrap">
            <Label label={t('status.label')} htmlFor="maintenance-status" />
            {getStatusBadge()}
            <Paragraph variant="muted" spacing="xs">
              {getSourceText()}
            </Paragraph>
            {!redisAvailable && (
              <Badge variant="warning" className="ml-auto">
                {t('source.redis_unavailable')}
              </Badge>
            )}
          </div>

          {/* Toggle Form */}
          <Form
            route="admin.settings.maintenance.update"
            className="grid gap-6"
            onBefore={(visit) => {
              const isValid = validation.validateAll(visit.data as Record<string, any>)
              if (!isValid) return false
            }}
          >
            {({ processing }) => (
              <>
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="enabled"
                      defaultChecked={config.enabled}
                      className="checkbox"
                    />
                    <span className="text-sm">{t('toggle.label')}</span>
                  </label>
                  <Label
                    label={config.enabled ? t('toggle.is_enabled') : t('toggle.is_disabled')}
                    htmlFor="enabled"
                  />
                </div>

                <hr className="border-edge" />

                <Field
                  label={t('message.label')}
                  name="message"
                  type="textarea"
                  defaultValue={config.message}
                  placeholder={t('message.placeholder')}
                  rows={4}
                  errorMessage={validation.getValidationMessage('message')}
                  onChange={(event) => {
                    validation.handleChange('message', event.target.value)
                  }}
                  onBlur={(event) => {
                    validation.handleBlur('message', event!.target.value)
                  }}
                  required
                />

                <Field
                  name="allowed_ips"
                  type="textarea"
                  label={t('allowed_ips.label')}
                  defaultValue={config.allowedIps.join('\n')}
                  placeholder={t('allowed_ips.placeholder')}
                  rows={6}
                />
                <Paragraph variant="muted" className="text-sm" spacing="xs">
                  {t('allowed_ips.help')}
                </Paragraph>

                <hr className="border-edge" />

                <Heading level={4}>{t('schedule.title')}</Heading>
                <Paragraph variant="muted" spacing="xs">
                  {t('schedule.help')}
                </Paragraph>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="schedule_enabled"
                    defaultChecked={config.scheduled?.enabled ?? false}
                    className="checkbox"
                  />
                  <span className="text-sm">{t('schedule.enable')}</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    type="datetime-local"
                    name="start_at"
                    label={t('schedule.start')}
                    defaultValue={toDatetimeLocal(config.scheduled?.startAt ?? '')}
                  />
                  <Field
                    type="datetime-local"
                    name="end_at"
                    label={t('schedule.end')}
                    defaultValue={toDatetimeLocal(config.scheduled?.endAt ?? '')}
                  />
                </div>

                <Button loading={processing} type="submit" fitContent variant="primary">
                  {t('submit')}
                </Button>
              </>
            )}
          </Form>

          {/* Memory Config Info */}
          {memoryConfig && memoryConfig.enabled && (
            <Card className="bg-amber-50 border-amber-200">
              <Heading level={4}>{t('memory.title')}</Heading>
              <Paragraph variant="muted" spacing="xs">
                {t('memory.description')}
              </Paragraph>
              <div className="grid gap-2 mt-4 text-sm">
                <div>Enabled: {memoryConfig.enabled ? 'Yes' : 'No'}</div>
                <div>Updated: {memoryConfig.updatedAt}</div>
              </div>
            </Card>
          )}

          {/* Redis Status */}
          {!redisAvailable && (
            <Card className="bg-red-50 border-red-200">
              <Heading level={4}>{t('redis_down.title')}</Heading>
              <Paragraph variant="muted" spacing="xs">
                {t('redis_down.description')}
              </Paragraph>
              <Paragraph variant="muted" className="text-sm" spacing="xs">
                {t('redis_down.help')}
              </Paragraph>
            </Card>
          )}
        </div>
      </Card>
    </AdminMain>
  )
}

MaintenancePage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
