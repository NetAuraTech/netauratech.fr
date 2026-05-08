import { Head } from '@inertiajs/react'
import { Section } from '~/components/atoms/section'
import { Card } from '~/components/atoms/card'
import { Field } from '~/components/molecules/field'
import { Button } from '~/components/atoms/button'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'
import { AuthIntro } from '~/components/molecules/auth/auth_intro'
import { useState } from 'react'
import { Data } from '@generated/data'
import { Banner } from '~/components/molecules/banner'
import type { AcceptInvitationTranslations } from '#types/translations'
import { useTranslation } from '~/hooks/use_translation'
import { Form } from '@adonisjs/inertia/react'

interface PageProps {
  token: string
  user: Data.User
  translations: AcceptInvitationTranslations
}

export default function AcceptInvitationPage(props: PageProps) {
  const { token, user, translations } = props

  const { t } = useTranslation(translations)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const validation = useFormValidation({
    email: presets.email(t('email.value')),
    username: presets.username(t('username.value')),
    password: presets.password(t('password.value')),
    password_confirmation: presets.passwordConfirmation(password, t('password.confirmation.value')),
  })

  return (
    <main>
      <Head title={t('title')} />
      <Section>
        <div className="container">
          <AuthIntro
            title={t('title')}
            text={t('sub_title')}
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            }
          />
          <Card>
            <Banner title={t('banner.title')} message={t('banner.message')} type="info" />
            <Form
              route="auth.accept_invitation.execute"
              className="grid gap-6 mt-6"
              onBefore={(visit) => {
                const isValid = validation.validateAll(visit.data as Record<string, any>)
                if (!isValid) return false
              }}
            >
              {({ errors, processing }) => (
                <>
                  <input type="hidden" id="token" name="token" value={token} />
                  <Field
                    label={t('email.value')}
                    name="email"
                    type="email"
                    defaultValue={user.email}
                    placeholder={t('email.placeholder')}
                    errorMessage={errors.email || validation.getValidationMessage('email')}
                    onChange={(event) => {
                      validation.handleChange('email', event.target.value)
                    }}
                    onBlur={(event) => {
                      validation.handleBlur('email', event!.target.value)
                    }}
                    helpText={t('email.help')}
                    required
                    sanitize
                  />
                  <Field
                    label={t('username.value')}
                    name="username"
                    type="text"
                    defaultValue={user.username}
                    placeholder={t('username.placeholder')}
                    errorMessage={errors.username || validation.getValidationMessage('username')}
                    onChange={(event) => {
                      validation.handleChange('username', event.target.value)
                    }}
                    onBlur={(event) => {
                      validation.handleBlur('username', event!.target.value)
                    }}
                    helpText={t('username.help')}
                    required
                    sanitize
                  />
                  <Field
                    label={t('password.value')}
                    name="password"
                    type="password"
                    errorMessage={errors.password || validation.getValidationMessage('password')}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      validation.handleChange('password', event.target.value)
                      validation.handleChange('password_confirmation', confirmPassword)
                    }}
                    onBlur={(event) => {
                      setPassword(event!.target.value)
                      validation.handleBlur('password', event!.target.value)
                      validation.handleBlur('password_confirmation', confirmPassword)
                    }}
                    required
                    sanitize={false}
                    helpText={t('password.help')}
                    helpClassName={validation.getHelpClassName('password')}
                  />
                  <Field
                    label={t('password.confirmation.value')}
                    name="password_confirmation"
                    type="password"
                    errorMessage={
                      errors.password_confirmation ||
                      validation.getValidationMessage('password_confirmation')
                    }
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      validation.handleChange('password_confirmation', event.target.value)
                    }}
                    onBlur={(event) => {
                      setConfirmPassword(event!.target.value)
                      validation.handleBlur('password_confirmation', event!.target.value)
                    }}
                    required
                    sanitize={false}
                    helpText={t('password.confirmation.help')}
                    helpClassName={validation.getHelpClassName('password_confirmation')}
                  />
                  <Button loading={processing} type={'submit'} fitContent>
                    {t('submit')}
                  </Button>
                </>
              )}
            </Form>
          </Card>
        </div>
      </Section>
    </main>
  )
}
