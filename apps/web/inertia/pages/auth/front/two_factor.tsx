import { Form } from '@adonisjs/inertia/react';
import { AuthIntro } from '@foundry/design-system/auth-intro';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { NavLink } from '@foundry/design-system/nav-link';
import { Paragraph } from '@foundry/design-system/paragraph';
import { Section } from '@foundry/design-system/section';
import { Head } from '@inertiajs/react';
import { actionFor, urlFor } from '~/client';
import { presets } from '~/helpers/validation_rules';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import type { TwoFactorTranslations } from '#transport/auth/helpers/i18n_payloads/two_factor';

interface PageProps {
	pendingEmail: string;
	translations: TwoFactorTranslations;
}

export default function TwoFactorPage(props: PageProps) {
	const { pendingEmail, translations } = props;
	const { t } = useTranslation(translations);

	const validation = useFormValidation({
		code: presets.requiredString(t('code.value')),
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
					<Card
						footer={
							<div className="text-center">
								<Paragraph fs="sm">
									{t('back_to_login')}: <NavLink href={urlFor('auth.session.render')} label={pendingEmail} fs="sm" />
								</Paragraph>
							</div>
						}
					>
						<Form
							action={actionFor('auth.two_factor.verify')}
							className="grid gap-6"
							onBefore={(visit) => {
								const isValid = validation.validateAll(visit.data as Record<string, any>);
								if (!isValid) return false;
							}}
						>
							{({ errors, processing }) => (
								<>
									<Field
										label={t('code.value')}
										name="code"
										type="text"
										placeholder={t('code.placeholder')}
										validation={validation}
										errors={errors}
										required
									/>
									<Paragraph variant="muted" spacing="xs" fs="sm">
										{t('apps')}
									</Paragraph>
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
