import { Form } from '@adonisjs/inertia/react';
import { AuthIntro } from '@foundry/design-system/auth-intro';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Section } from '@foundry/design-system/section';
import { Head } from '@inertiajs/react';
import { actionFor, urlFor } from '~/client';
import { sanitizeEmail } from '~/helpers/sanitization';
import { presets } from '~/helpers/validation_rules';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import type { ForgotPasswordTranslations } from '#transport/auth/helpers/i18n_payloads/forgot_password';

interface ForgotPasswordPageProps {
	translations: ForgotPasswordTranslations;
}

export default function ForgotPasswordPage(props: ForgotPasswordPageProps) {
	const { translations } = props;
	const { t } = useTranslation(translations);

	const validation = useFormValidation({
		email: presets.email(t('email.value')),
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
							action={actionFor('auth.forgot_password.execute')}
							className="grid gap-6"
							onBefore={(visit) => {
								const isValid = validation.validateAll(visit.data as Record<string, any>);
								if (!isValid) return false;
							}}
						>
							{({ errors, processing }) => (
								<>
									<Field
										label={t('email.value')}
										name="email"
										type="email"
										placeholder={t('email.placeholder')}
										validation={validation}
										errors={errors}
										required
										sanitizeValue={sanitizeEmail}
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
