import { Form } from '@adonisjs/inertia/react';
import { Avatar } from '@foundry/design-system/avatar';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Label } from '@foundry/design-system/label';
import { Data } from '@generated/data';
import { actionFor } from '~/client';
import { SettingsLayout } from '~/components/organisms/settings_layout';
import { sanitizeText } from '~/helpers/sanitization';
import { presets } from '~/helpers/validation_rules';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import type { SettingsProfileTranslations } from '#transport/account/helpers/i18n_payloads/profile';

interface PageProps {
	user: Data.Identity.User;
	translations: SettingsProfileTranslations;
}

export default function ProfilePage(props: PageProps) {
	const { user, translations } = props;

	const { t } = useTranslation(translations);

	const validation = useFormValidation({
		username: presets.username(t('username.value')),
	});

	return (
		<main>
			<SettingsLayout tab="profile" translations={translations}>
				<Card title={t('title')} subtitle={t('sub_title')}>
					<Form
						action={actionFor('account.profile.execute')}
						className="grid gap-6"
						onBefore={(visit) => {
							const isValid = validation.validateAll(visit.data as Record<string, any>);
							if (!isValid) return false;
						}}
					>
						{({ errors, processing }) => (
							<>
								<div className="grid gap-2">
									<Label label={t('avatar.value')} htmlFor="avatar" />
									<div className="flex gap-4">
										<Avatar username={user.username} />
										<Button variant="outline" fitContent>
											{t('avatar.change')}
										</Button>
									</div>
								</div>
								<Field
									label={t('username.value')}
									name="username"
									type="text"
									defaultValue={user.username || ''}
									placeholder={t('username.placeholder')}
									validation={validation}
									errors={errors}
									required
									sanitizeValue={sanitizeText}
								/>
								<Button loading={processing} type={'submit'} fitContent>
									{t('submit')}
								</Button>
							</>
						)}
					</Form>
				</Card>
			</SettingsLayout>
		</main>
	);
}
