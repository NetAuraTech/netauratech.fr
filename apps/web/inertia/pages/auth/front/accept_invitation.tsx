import { Form } from '@adonisjs/inertia/react';
import { AuthIntro } from '@foundry/design-system/auth-intro';
import { Banner } from '@foundry/design-system/banner';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Section } from '@foundry/design-system/section';
import { Data } from '@generated/data';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { actionFor } from '~/client';
import { sanitizeEmail, sanitizeText } from '~/helpers/sanitization';
import { presets } from '~/helpers/validation_rules';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import type { AcceptInvitationTranslations } from '#transport/auth/helpers/i18n_payloads/accept_invitation';

interface PageProps {
	token: string;
	user: Data.Identity.User;
	translations: AcceptInvitationTranslations;
}

export default function AcceptInvitationPage(props: PageProps) {
	const { token, user, translations } = props;

	const { t } = useTranslation(translations);

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const validation = useFormValidation({
		email: presets.email(t('email.value')),
		username: presets.username(t('username.value')),
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
						<Banner title={t('banner.title')} message={t('banner.message')} type="info" />
						<Form
							action={actionFor('auth.accept_invitation.execute')}
							className="grid gap-6 mt-6"
							onBefore={(visit) => {
								const isValid = validation.validateAll(visit.data as Record<string, any>);
								if (!isValid) return false;
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
										validation={validation}
										errors={errors}
										helpText={t('email.help')}
										required
										sanitizeValue={sanitizeEmail}
									/>
									<Field
										label={t('username.value')}
										name="username"
										type="text"
										defaultValue={user.username}
										placeholder={t('username.placeholder')}
										validation={validation}
										errors={errors}
										helpText={t('username.help')}
										required
										sanitizeValue={sanitizeText}
									/>
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
