import { Form } from '@adonisjs/inertia/react';
import { AuthIntro } from '@foundry/design-system/auth-intro';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Section } from '@foundry/design-system/section';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { actionFor, urlFor } from '~/client';
import { presets } from '~/helpers/validation_rules';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import type { ResetPasswordTranslations } from '#transport/auth/helpers/i18n_payloads/reset_password';

interface ResetPasswordPageProps {
	token: string;
	translations: ResetPasswordTranslations;
}

export default function ResetPasswordPage(props: ResetPasswordPageProps) {
	const { token, translations } = props;
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
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						}
					/>
					<Card>
						<Form
							action={actionFor('auth.reset_password.execute')}
							className="grid gap-6"
							onBefore={(visit) => {
								const isValid = validation.validateAll(visit.data as Record<string, any>);
								if (!isValid) return false;
							}}
						>
							{({ errors, processing }) => (
								<>
									<input type="hidden" id="token" name="token" value={token} />
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
									<div className="flex gap-3">
										<Button loading={processing} type={'submit'} fitContent>
											{t('submit')}
										</Button>
										<Button href={urlFor('auth.session.render')} fitContent variant="outline">
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
	);
}
