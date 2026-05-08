import { Head } from '@inertiajs/react'
import { Section } from '~/components/atoms/section'
import { Card } from '~/components/atoms/card'
import { Paragraph } from '~/components/atoms/paragraph'
import { NavLink } from '~/components/atoms/nav_link'
import { Field } from '~/components/molecules/field'
import { Button } from '~/components/atoms/button'
import { useFormValidation } from '~/hooks/use_form_validation'
import { presets } from '~/helpers/validation_rules'
import { AuthIntro } from '~/components/molecules/auth/auth_intro'
import type { OAuthProvider } from '#types/auth'
import { AuthProviders } from '~/components/molecules/auth/auth_providers'
import { useTranslation } from '~/hooks/use_translation'
import type { LoginTranslations } from '#types/translations'
import { Form } from '@adonisjs/inertia/react'

interface PageProps {
  providers: OAuthProvider[]
  translations: LoginTranslations
}

export default function LoginPage(props: PageProps) {
  const { providers, translations } = props
  const { t } = useTranslation(translations)

  const validation = useFormValidation({
    email: presets.email(t('email.value')),
    password: presets.password(t('password.value')),
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
                  {t('account.no')}{' '}
                  <NavLink route={'auth.register.render'} label={t('account.create')} fs="sm" />
                </Paragraph>
              </div>
            }
          >
            <Form
              route="auth.session.execute"
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
                      validation.handleChange('password', event.target.value)
                    }}
                    onBlur={(event) => {
                      validation.handleBlur('password', event!.target.value)
                    }}
                    required
                    sanitize={false}
                  />
                  <div className="grid gap-2 md:flex md:items-center md:justify-between">
                    <Field label={t('remember_me')} name="remember_me" type="checkbox" />
                    <NavLink route="auth.forgot_password.render" label={t('password.forgot')} />
                  </div>
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
