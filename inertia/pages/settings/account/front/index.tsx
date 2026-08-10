import { SettingsLayout } from '~/components/organisms/settings_layout'
import { Card } from '~/components/atoms/card'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'
import { Field } from '~/components/molecules/field'
import { Button } from '~/components/atoms/button'
import { Data } from '@generated/data'
import type { OAuthProvider } from '#types/auth'
import { capitalize } from '~/lib/string'
import { urlFor } from '~/client'
import { useState } from 'react'
import { Banner } from '~/components/molecules/banner'
import { getIcon } from '~/helpers/oauth'
import type { SettingsAccountTranslations } from '#types/translations'
import { useTranslation } from '~/hooks/use_translation'
import { Form } from '@adonisjs/inertia/react'

interface PageProps {
  user: Data.User
  providers: OAuthProvider[]
  translations: SettingsAccountTranslations
}

export default function AccountPage(props: PageProps) {
  const { user, providers, translations } = props

  const { t } = useTranslation(translations)

  const validationEmailForm = useFormValidation({
    email: presets.email(t('email.value')),
  })

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const validationPasswordForm = useFormValidation({
    current_password: presets.password(t('password.current.value')),
    password: presets.password(t('password.new.value')),
    password_confirmation: presets.passwordConfirmation(password, t('password.confirm.value')),
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const validationDeleteForm = useFormValidation({
    password: presets.password(t('delete.password')),
  })

  return (
    <main>
      <SettingsLayout tab="account" translations={translations}>
        <Card title={t('email.title')} subtitle={t('email.sub_title')}>
          <Form
            route="settings.account.execute"
            className="grid gap-6"
            onBefore={(visit) => {
              const isValid = validationEmailForm.validateAll(visit.data as Record<string, any>)
              if (!isValid) return false
            }}
          >
            {({ errors, processing }) => (
              <>
                <input type="hidden" name="_action" value="update_email" />
                <Field
                  label={t('email.value')}
                  name="email"
                  type="email"
                  defaultValue={user.email || ''}
                  placeholder={t('email.placeholder')}
                  errorMessage={errors.email || validationEmailForm.getValidationMessage('email')}
                  onChange={(event) => {
                    validationEmailForm.handleChange('email', event.target.value)
                  }}
                  onBlur={(event) => {
                    validationEmailForm.handleBlur('email', event!.target.value)
                  }}
                  required
                  sanitize
                />
                <Button loading={processing} type={'submit'} fitContent name="update_email_submit">
                  {t('email.submit')}
                </Button>
              </>
            )}
          </Form>
        </Card>
        <Card title={t('oauth.title')} subtitle={t('oauth.sub_title')}>
          <div className="divide-y divide-edge">
            {providers.map((provider) => {
              const isConnected = user.connectedProviders[provider]

              return (
                <div key={provider} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {getIcon(provider)}
                    <div>
                      <p className="text-sm font-medium text-ink">{capitalize(provider)}</p>
                      <p className={`text-xs ${isConnected ? 'text-success' : 'text-ink-muted'}`}>
                        {isConnected ? t('oauth.connected') : t('oauth.not_connected')}
                      </p>
                    </div>
                  </div>

                  {isConnected ? (
                    <Form
                      route="auth.social.unlink"
                      routeParams={{ provider: provider }}
                      onBefore={() =>
                        confirm(t('oauth.unlink.confirm', { provider: capitalize(provider) }))
                      }
                    >
                      <button
                        type="submit"
                        className="cursor-pointer text-sm px-3 py-1.5 border border-danger text-danger rounded-lg hover:bg-danger-soft transition"
                        title={t('oauth.unlink')}
                      >
                        {t('oauth.unlink.value')}
                      </button>
                    </Form>
                  ) : (
                    <a
                      href={urlFor('auth.social.redirect', { provider: provider })}
                      className="text-sm px-3 py-1.5 border text-ink-muted border-edge rounded-lg hover:bg-sunken transition"
                      title={t('oauth.link')}
                    >
                      {t('oauth.link')}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
        <Card title={t('password.title')} subtitle={t('password.sub_title')}>
          <Form
            route="settings.account.execute"
            className="grid gap-6"
            onBefore={(visit) => {
              const isValid = validationPasswordForm.validateAll(visit.data as Record<string, any>)
              if (!isValid) return false
            }}
          >
            {({ errors, processing }) => (
              <>
                <input type="hidden" name="_action" value="update_password" />
                <Field
                  label={t('password.current.value')}
                  name="current_password"
                  type="password"
                  errorMessage={
                    errors.current_password ||
                    validationPasswordForm.getValidationMessage('current_password')
                  }
                  onChange={(event) => {
                    validationPasswordForm.handleChange('current_password', event.target.value)
                  }}
                  onBlur={(event) => {
                    validationPasswordForm.handleBlur('current_password', event!.target.value)
                  }}
                  required
                  sanitize
                />
                <Field
                  label={t('password.new.value')}
                  name="password"
                  type="password"
                  errorMessage={
                    errors.password || validationPasswordForm.getValidationMessage('password')
                  }
                  onChange={(event) => {
                    setPassword(event.target.value)
                    validationPasswordForm.handleChange('password', event.target.value)
                    validationPasswordForm.handleChange('password_confirmation', confirmPassword)
                  }}
                  onBlur={(event) => {
                    setPassword(event!.target.value)
                    validationPasswordForm.handleBlur('password', event!.target.value)
                    validationPasswordForm.handleBlur('password_confirmation', confirmPassword)
                  }}
                  required
                  sanitize={false}
                  helpText={t('password.new.help')}
                  helpClassName={validationPasswordForm.getHelpClassName('password')}
                />
                <Field
                  label={t('password.confirm.value')}
                  name="password_confirmation"
                  type="password"
                  errorMessage={
                    errors.password_confirmation ||
                    validationPasswordForm.getValidationMessage('password_confirmation')
                  }
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    validationPasswordForm.handleChange('password_confirmation', event.target.value)
                  }}
                  onBlur={(event) => {
                    setConfirmPassword(event!.target.value)
                    validationPasswordForm.handleBlur('password_confirmation', event!.target.value)
                  }}
                  required
                  sanitize={false}
                  helpText={t('password.confirm.help')}
                  helpClassName={validationPasswordForm.getHelpClassName('password_confirmation')}
                />
                <Button
                  loading={processing}
                  type={'submit'}
                  fitContent
                  name="update_password_submit"
                >
                  {t('password.submit')}
                </Button>
              </>
            )}
          </Form>
        </Card>
        <Card title={t('delete.title')} subtitle={t('delete.sub_title')} border="danger">
          {!showDeleteConfirm ? (
            <Button
              variant="danger"
              fitContent
              onClick={() => setShowDeleteConfirm(true)}
              name="delete_account_show"
            >
              {t('delete.submit')}
            </Button>
          ) : (
            <div className="grid gap-4">
              <Banner
                title={t('delete.confirm.title')}
                message={t('delete.confirm.sub_title')}
                type="danger"
              />
              <Form
                route="settings.account.destroy"
                className="grid gap-6"
                onBefore={(visit) => {
                  const isValid = validationDeleteForm.validateAll(
                    visit.data as Record<string, any>
                  )
                  if (!isValid) return false
                }}
              >
                {({ errors, processing, reset }) => (
                  <>
                    <Field
                      label={t('delete.password')}
                      name="password"
                      type="password"
                      errorMessage={
                        errors.password || validationDeleteForm.getValidationMessage('password')
                      }
                      onChange={(event) => {
                        validationDeleteForm.handleChange('password', event.target.value)
                      }}
                      onBlur={(event) => {
                        validationDeleteForm.handleBlur('password', event!.target.value)
                      }}
                      required
                      sanitize={false}
                      helpClassName={validationDeleteForm.getHelpClassName('password')}
                    />
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        fitContent
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          reset('password')
                          validationDeleteForm.reset()
                        }}
                        name="delete_account_cancel"
                      >
                        {t('delete.cancel')}
                      </Button>
                      <Button
                        loading={processing}
                        type={'submit'}
                        fitContent
                        variant="danger"
                        name="delete_account_submit"
                      >
                        {t('delete.submit')}
                      </Button>
                    </div>
                  </>
                )}
              </Form>
            </div>
          )}
        </Card>
      </SettingsLayout>
    </main>
  )
}
