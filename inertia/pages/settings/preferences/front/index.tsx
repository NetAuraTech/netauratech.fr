import { SettingsLayout } from '~/components/organisms/settings_layout'
import { Card } from '~/components/atoms/card'
import { useFormValidation } from '~/hooks/use_form_validation'
import { rules } from '~/helpers/validation_rules'
import { Button } from '~/components/atoms/button'
import { Field } from '~/components/molecules/field'
import { SelectOption } from '~/components/atoms/select_option'
import { ThemeToggle } from '~/components/molecules/theme_toggle'
import { Label } from '~/components/atoms/label'
import type { SettingsPreferencesTranslations } from '#types/translations'
import { useTranslation } from '~/hooks/use_translation'
import { usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'
import { Form } from '@adonisjs/inertia/react'

interface PreferencesPageProps {
  translations: SettingsPreferencesTranslations
}

export default function PreferencesPage(props: PreferencesPageProps) {
  const { translations } = props
  const { t } = useTranslation(translations)

  const pageProps = usePage<SharedProps>().props

  const validationLocale = useFormValidation({
    locale: [
      rules.required(t('interface.locale.value')),
      rules.minLength(2, t('interface.locale.value')),
      rules.maxLength(2, t('interface.locale.value')),
    ],
  })

  return (
    <main>
      <SettingsLayout tab="preferences" translations={translations}>
        <Card title={t('interface.title')} subtitle={t('interface.sub_title')}>
          <Form
            route="settings.preferences.execute"
            className="grid gap-6"
            onBefore={(visit) => {
              const isValid = validationLocale.validateAll(visit.data as Record<string, any>)
              if (!isValid) return false
            }}
          >
            {({ errors, processing }) => (
              <>
                <Field
                  label={t('interface.locale.value')}
                  name="locale"
                  type="select"
                  defaultValue={pageProps.preferences?.locale || 'en'}
                  errorMessage={errors.locale || validationLocale.getValidationMessage('locale')}
                  onChange={(event) => {
                    validationLocale.handleChange('locale', event.target.value)
                  }}
                  onBlur={(event) => {
                    validationLocale.handleBlur('locale', event!.target.value)
                  }}
                  required
                  sanitize
                >
                  <SelectOption value="en" label={t('interface.locale.english')} />
                  <SelectOption value="fr" label={t('interface.locale.french')} />
                </Field>
                <Button loading={processing} type={'submit'} fitContent>
                  {t('interface.submit')}
                </Button>
              </>
            )}
          </Form>
        </Card>
        <Card title={t('appearance.title')} subtitle={t('appearance.sub_title')}>
          <div className="flex gap-4">
            <Label label={t('appearance.value')} htmlFor="theme" />
            <ThemeToggle />
          </div>
        </Card>
      </SettingsLayout>
    </main>
  )
}
