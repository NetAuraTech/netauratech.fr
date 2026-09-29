import { Form } from '@adonisjs/inertia/react';
import { SharedProps } from '@adonisjs/inertia/types';
import { AdminMain } from '@foundry/design-system/admin-main';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Icon } from '@foundry/design-system/icon';
import { SelectOption } from '@foundry/design-system/select';
import { Data } from '@generated/data';
import { ReactElement } from 'react';
import { actionFor, urlFor } from '~/client';
import { CanAccess } from '~/guards/can_access';
import { sanitizeEmail, sanitizeText } from '~/helpers/sanitization';
import { presets, rules } from '~/helpers/validation_rules';
import { useMenu } from '~/hooks/use_admin';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import Layout from '~/layouts/admin';
import type { AdminUsersFormTranslations } from '#transport/identity/helpers/i18n_payloads/users_form';

type PageProps = {
	user?: Data.Identity.User;
	roles: Data.Identity.Role[];
	translations: AdminUsersFormTranslations;
};

export default function UsersFormPage(props: PageProps) {
	const { user, roles, translations } = props;
	const { t } = useTranslation(translations);

	const isEditing = user !== undefined;

	const { getEntryIcon } = useMenu();

	const validation = useFormValidation({
		email: presets.email(t('email.value')),
		username: presets.username(t('username.value')),
		role_id: [...presets.selectWithOptions([...roles.map((r) => r.id)], 'role_id'), rules.required('role_id')],
		api_rate_limit: [
			rules.custom(
				(value) =>
					value === undefined ||
					value === null ||
					value === '' ||
					(Number.isInteger(Number(value)) && Number(value) > 0),
				'api_rate_limit.positive_integer',
			),
		],
	});

	return (
		<AdminMain
			title={isEditing ? t('title.edit', { username: user!.username }) : t('title.create')}
			icon={getEntryIcon('admin.identity.users.render')}
		>
			<Card
				header={
					<div className="flex items-center justify-between gap-3">
						<CanAccess permission="users.view">
							<Button variant="icon" href={urlFor('admin.identity.users.render')} title={t('actions.list')} fitContent>
								<Icon name="ArrowLeft" />
							</Button>
						</CanAccess>
					</div>
				}
			>
				<Form
					action={
						isEditing
							? actionFor('admin.identity.users_update.execute', { id: user!.id })
							: actionFor('admin.identity.users_create.execute')
					}
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
								defaultValue={user?.email}
								placeholder={t('email.placeholder')}
								validation={validation}
								errors={errors}
								required
								sanitizeValue={sanitizeEmail}
							/>
							<Field
								label={t('username.value')}
								name="username"
								type="text"
								defaultValue={user?.username}
								placeholder={t('username.placeholder')}
								validation={validation}
								errors={errors}
								required
								sanitizeValue={sanitizeText}
							/>
							<Field
								label={t('roles.value')}
								name="role_id"
								type="select"
								defaultValue={user?.role?.id}
								placeholder={t('roles.placeholder')}
								validation={validation}
								errors={errors}
								required
								sanitizeValue={sanitizeText}
							>
								{roles &&
									roles.map((role) => (
										<SelectOption key={`role-${role.id}`} label={t(role.name as any)} value={role.id} />
									))}
							</Field>
							{isEditing && (
								<Field
									label={t('api_rate_limit.value')}
									name="api_rate_limit"
									type="number"
									defaultValue={user?.apiRateLimit ?? ''}
									placeholder={t('api_rate_limit.placeholder')}
									validation={validation}
									errors={errors}
								/>
							)}
							<Button loading={processing} type={'submit'} fitContent>
								{t('submit')}
							</Button>
						</>
					)}
				</Form>
			</Card>
		</AdminMain>
	);
}

UsersFormPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>;
