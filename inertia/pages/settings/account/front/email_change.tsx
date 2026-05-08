import { Head } from '@inertiajs/react'
import { Section } from '~/components/atoms/section'
import { Card } from '~/components/atoms/card'
import { Button } from '~/components/atoms/button'
import { useFormValidation } from '~/hooks/use_form_validation'
import { rules } from '~/helpers/validation_rules'
import { AuthIntro } from '~/components/molecules/auth/auth_intro'
import { Field } from '~/components/molecules/field'
import { Banner } from '~/components/molecules/banner'
import { useTranslation } from '~/hooks/use_translation'
import type { EmailChangeTranslations } from '#types/translations'
import { Form } from '@adonisjs/inertia/react'

interface PageProps {
  token: string
  translations: EmailChangeTranslations
}

export default function EmailChangePage(props: PageProps) {
  const { token, translations } = props
  const { t } = useTranslation(translations)

  const validation = useFormValidation({
    token: [rules.required('token')],
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
          <Card>
            <Form
              route="settings.email_change.execute"
              className="grid gap-6"
              onBefore={(visit) => {
                const isValid = validation.validateAll(visit.data as Record<string, any>)
                if (!isValid) return false
              }}
            >
              {({ errors, processing }) => (
                <>
                  <Banner title={t('info.title')} message={t('info.message')} type="info" />
                  <Field
                    label={t('token')}
                    name="token"
                    type="text"
                    defaultValue={token}
                    errorMessage={errors.token || validation.getValidationMessage('token')}
                    onChange={(event) => {
                      validation.handleChange('token', event.target.value)
                    }}
                    onBlur={(event) => {
                      validation.handleBlur('token', event!.target.value)
                    }}
                    required
                    disabled
                    sanitize
                  />
                  <input id="token" name="token" type="hidden" value={token} />
                  <div className="flex gap-3">
                    <Button loading={processing} type={'submit'} fitContent>
                      {t('submit')}
                    </Button>
                    <Button route="settings.account.render" fitContent variant="outline">
                      {t('cancel')}
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
