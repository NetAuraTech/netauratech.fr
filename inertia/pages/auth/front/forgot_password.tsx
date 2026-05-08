import { Section } from '~/components/atoms/section'
import { Card } from '~/components/atoms/card'
import { Field } from '~/components/molecules/field'
import { Button } from '~/components/atoms/button'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'
import { AuthIntro } from '~/components/molecules/auth/auth_intro'
import type { ForgotPasswordTranslations } from '#types/translations'
import { useTranslation } from '~/hooks/use_translation'
import { Form } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'

interface ForgotPasswordPageProps {
  translations: ForgotPasswordTranslations
}

export default function ForgotPasswordPage(props: ForgotPasswordPageProps) {
  const { translations } = props
  const { t } = useTranslation(translations)

  const validation = useFormValidation({
    email: presets.email(t('email.value')),
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
              route="auth.forgot_password.execute"
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
