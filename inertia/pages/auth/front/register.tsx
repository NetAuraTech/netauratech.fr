import { Head } from '@inertiajs/react'
import { Section } from '~/components/atoms/section'
import { AuthIntro } from '~/components/molecules/auth/auth_intro'
import { Card } from '~/components/atoms/card'
import { Paragraph } from '~/components/atoms/paragraph'
import { NavLink } from '~/components/atoms/nav_link'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'
import { Field } from '~/components/molecules/field'
import { Button } from '~/components/atoms/button'
import { useState } from 'react'
import { useTranslation } from '~/hooks/use_translation'
import type { RegisterTranslations } from '#types/translations'
import { Form } from '@adonisjs/inertia/react'
import type { OAuthProvider } from '#types/auth'
import { AuthProviders } from '~/components/molecules/auth/auth_providers'

interface RegisterPageProps {
  providers: OAuthProvider[]
  translations: RegisterTranslations
}

export default function RegisterPage(props: RegisterPageProps) {
  const { providers, translations } = props
  const { t } = useTranslation(translations)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const validation = useFormValidation({
    email: presets.email(t('email.value')),
    password: presets.password(t('password.value')),
    password_confirmation: presets.passwordConfirmation(
      password,
      t('password.confirmation.value'),
      t('password.value')
    ),
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            }
          />
          <Card
            footer={
              <div className="text-center">
                <Paragraph fs="sm">
                  {t('account.has')}{' '}
                  <NavLink route="auth.session.render" label={t('account.login')} fs="sm" />
                </Paragraph>
              </div>
            }
          >
            <Form
              route="auth.register.execute"
              className="grid gap-6"
              onBefore={(visit) => {
                const isValid = validation.validateAll(visit.data as Record<string, any>)
                if (!isValid) return false
              }}
            >
              {({ errors, processing }) => (
                <>
                  <Field
                    label={t('email.value')}
                    name="email"
                    type="email"
                    placeholder={t('email.placeholder')}
                    errorMessage={errors.email || validation.getValidationMessage('email')}
                    onChange={(event) => {
                      validation.handleChange('email', event.target.value)
                    }}
                    onBlur={(event) => {
                      validation.handleBlur('email', event!.target.value)
                    }}
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
            <AuthProviders providers={providers} translations={translations} />
          </Card>
        </div>
      </Section>
    </main>
  )
}
