import { Form } from '@adonisjs/inertia/react';
import { AuthIntro } from '@foundry/design-system/auth-intro';
import { Banner } from '@foundry/design-system/banner';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Section } from '@foundry/design-system/section';
import { Head } from '@inertiajs/react';
import { actionFor, urlFor } from '~/client';
import { sanitizeText } from '~/helpers/sanitization';
import { rules } from '~/helpers/validation_rules';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import type { EmailChangeTranslations } from '#transport/account/helpers/i18n_payloads/email_change';

interface PageProps {
	token: string;
	translations: EmailChangeTranslations;
}

export default function EmailChangePage(props: PageProps) {
	const { token, translations } = props;
	const { t } = useTranslation(translations);

	const validation = useFormValidation({
		token: [rules.required('token')],
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
							action={actionFor('account.email_change.execute')}
							className="grid gap-6"
							onBefore={(visit) => {
								const isValid = validation.validateAll(visit.data as Record<string, any>);
								if (!isValid) return false;
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
										validation={validation}
										errors={errors}
										required
										disabled
										sanitizeValue={sanitizeText}
									/>
									<input id="token" name="token" type="hidden" value={token} />
									<div className="flex gap-3">
										<Button loading={processing} type={'submit'} fitContent>
											{t('submit')}
										</Button>
										<Button href={urlFor('account.account.render')} fitContent variant="outline">
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
	);
}
