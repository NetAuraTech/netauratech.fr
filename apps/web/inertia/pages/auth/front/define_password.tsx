import { Form } from '@adonisjs/inertia/react';
import { AuthIntro } from '@foundry/design-system/auth-intro';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Section } from '@foundry/design-system/section';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { actionFor } from '~/client';
import { presets } from '~/helpers/validation_rules';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import type { DefinePasswordTranslations } from '#transport/auth/helpers/i18n_payloads/social_define_password';

interface DefinePasswordPageProps {
	translations: DefinePasswordTranslations;
}

export default function DefinePasswordPage(props: DefinePasswordPageProps) {
	const { translations } = props;
	const { t } = useTranslation(translations);

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const validation = useFormValidation({
		password: presets.password(t('password.value')),
		password_confirmation: presets.passwordConfirmation(password, t('password.confirmation.value')),
	});

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
							action={actionFor('auth.social.execute')}
							className="grid gap-6"
							onBefore={(visit) => {
								const isValid = validation.validateAll(visit.data as Record<string, any>);
								if (!isValid) return false;
							}}
						>
							{({ errors, processing }) => (
								<>
									<Field
										label={t('password.value')}
										name="password"
										type="password"
										validation={validation}
										errors={errors}
										onChange={(event) => {
											setPassword(event.target.value);
											validation.handleChange('password', event.target.value);
											validation.handleChange('password_confirmation', confirmPassword);
										}}
										onBlur={(event) => {
											setPassword(event!.target.value);
											validation.handleBlur('password', event!.target.value);
											validation.handleBlur('password_confirmation', confirmPassword);
										}}
										required
										helpText={t('password.help')}
									/>
									<Field
										label={t('password.confirmation.value')}
										name="password_confirmation"
										type="password"
										validation={validation}
										errors={errors}
										onChange={(event) => {
											setConfirmPassword(event.target.value);
											validation.handleChange('password_confirmation', event.target.value);
										}}
										onBlur={(event) => {
											setConfirmPassword(event!.target.value);
											validation.handleBlur('password_confirmation', event!.target.value);
										}}
										required
										helpText={t('password.confirmation.help')}
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
	);
}
