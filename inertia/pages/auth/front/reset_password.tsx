import { Head } from '@inertiajs/react'
import { Section } from '~/components/atoms/section'
import { Card } from '~/components/atoms/card'
import { Field } from '~/components/molecules/field'
import { Button } from '~/components/atoms/button'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'
import { AuthIntro } from '~/components/molecules/auth/auth_intro'
import { useState } from 'react'
import type { ResetPasswordTranslations } from '#types/translations'
import { useTranslation } from '~/hooks/use_translation'
import { Form } from '@adonisjs/inertia/react'

interface ResetPasswordPageProps {
  token: string
  translations: ResetPasswordTranslations
}

export default function ResetPasswordPage(props: ResetPasswordPageProps) {
  const { token, translations } = props
  const { t } = useTranslation(translations)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const validation = useFormValidation({
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
            <Form
              route="auth.reset_password.execute"
              className="grid gap-6"
              onBefore={(visit) => {
                const isValid = validation.validateAll(visit.data as Record<string, any>)
                if (!isValid) return false
              }}
            >
              {({ errors, processing }) => (
                <>
                  <input type="hidden" id="token" name="token" value={token} />
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
                  <div className="flex gap-3">
                    <Button loading={processing} type={'submit'} fitContent>
                      {t('submit')}
                    </Button>
                    <Button route="auth.session.render" fitContent variant="outline">
                      {t('back_to_login')}
                    </Button>
                  </div>
                </>
              )}
            </Form>
          </Card>
        </div>
      </Section>
    </main>
  )
}
