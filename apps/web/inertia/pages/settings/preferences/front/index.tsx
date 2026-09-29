import { Form } from '@adonisjs/inertia/react';
import { SharedProps } from '@adonisjs/inertia/types';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Label } from '@foundry/design-system/label';
import { SelectOption } from '@foundry/design-system/select';
import { usePage } from '@inertiajs/react';
import { actionFor } from '~/client';
import { ThemeToggle } from '~/components/molecules/theme_toggle';
import { SettingsLayout } from '~/components/organisms/settings_layout';
import { sanitizeText } from '~/helpers/sanitization';
import { rules } from '~/helpers/validation_rules';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import type { SettingsPreferencesTranslations } from '#transport/account/helpers/i18n_payloads/preferences';

interface PreferencesPageProps {
	translations: SettingsPreferencesTranslations;
}

export default function PreferencesPage(props: PreferencesPageProps) {
	const { translations } = props;
	const { t } = useTranslation(translations);

	const pageProps = usePage<SharedProps>().props;

	const validationLocale = useFormValidation({
		locale: [
			rules.required(t('interface.locale.value')),
			rules.minLength(2, t('interface.locale.value')),
			rules.maxLength(2, t('interface.locale.value')),
		],
	});

	return (
		<main>
			<SettingsLayout tab="preferences" translations={translations}>
				<Card title={t('interface.title')} subtitle={t('interface.sub_title')}>
					<Form
						action={actionFor('account.preferences.execute')}
						className="grid gap-6"
						onBefore={(visit) => {
							const isValid = validationLocale.validateAll(visit.data as Record<string, any>);
							if (!isValid) return false;
						}}
					>
						{({ errors, processing }) => (
							<>
								<Field
									label={t('interface.locale.value')}
									name="locale"
									type="select"
									defaultValue={pageProps.preferences?.locale || 'en'}
									validation={validationLocale}
									errors={errors}
									required
									sanitizeValue={sanitizeText}
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
	);
}
