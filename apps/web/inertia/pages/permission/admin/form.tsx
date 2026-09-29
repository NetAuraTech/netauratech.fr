import { Form } from '@adonisjs/inertia/react';
import { SharedProps } from '@adonisjs/inertia/types';
import { AdminMain } from '@foundry/design-system/admin-main';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Icon } from '@foundry/design-system/icon';
import { Data } from '@generated/data';
import { ReactElement } from 'react';
import { actionFor, urlFor } from '~/client';
import { CanAccess } from '~/guards/can_access';
import { sanitizeRichText, sanitizeText } from '~/helpers/sanitization';
import { rules } from '~/helpers/validation_rules';
import { useMenu } from '~/hooks/use_admin';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import Layout from '~/layouts/admin';
import type { AdminPermissionsFormTranslations } from '#transport/identity/helpers/i18n_payloads/permissions_form';

type PageProps = {
	permission: Data.Identity.Permission | null;
	translations: AdminPermissionsFormTranslations;
};

export default function PermissionsFormPage(props: PageProps) {
	const { permission, translations } = props;
	const { t } = useTranslation(translations);

	const isEditing = permission !== null;

	const { getEntryIcon } = useMenu();

	const validation = useFormValidation({
		name: [rules.required(t('name.value')), rules.minLength(2, t('name.value')), rules.maxLength(100, t('name.value'))],
		slug: [
			rules.required(t('slug.value')),
			rules.minLength(2, t('slug.value')),
			rules.maxLength(100, t('slug.value')),
			rules.pattern(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, 'slug_format'),
		],
		category: [
			rules.required(t('category.value')),
			rules.minLength(2, t('category.value')),
			rules.maxLength(50, t('category.value')),
		],
		description: [rules.maxLength(255, t('description.value'))],
	});

	return (
		<AdminMain
			title={isEditing ? t('title.edit', { name: permission.name }) : t('title.create')}
			icon={getEntryIcon('admin.identity.permissions.render')}
		>
			<Card
				header={
					<div className="flex items-center justify-between gap-3">
						<CanAccess permission="permissions.view">
							<Button
								variant="icon"
								href={urlFor('admin.identity.permissions.render')}
								title={t('actions.list')}
								fitContent
							>
								<Icon name="ArrowLeft" />
							</Button>
						</CanAccess>
					</div>
				}
			>
				<Form
					action={
						isEditing
							? actionFor('admin.identity.permissions_update.execute', { id: permission.id })
							: actionFor('admin.identity.permissions_create.execute')
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
								label={t('name.value')}
								name="name"
								type="text"
								defaultValue={permission?.name}
								placeholder={t('name.placeholder')}
								validation={validation}
								errors={errors}
								required
								sanitizeValue={sanitizeText}
							/>
							<Field
								label={t('slug.value')}
								name="slug"
								type="text"
								defaultValue={permission?.slug}
								placeholder={t('slug.placeholder')}
								validation={validation}
								errors={errors}
								required
								sanitizeValue={sanitizeText}
							/>
							<Field
								label={t('category.value')}
								name="category"
								type="text"
								defaultValue={permission?.category}
								placeholder={t('category.placeholder')}
								validation={validation}
								errors={errors}
								required
								sanitizeValue={sanitizeText}
							/>
							<Field
								label={t('description.value')}
								name="description"
								type="textarea"
								defaultValue={permission?.description ?? ''}
								placeholder={t('description.placeholder')}
								validation={validation}
								errors={errors}
								sanitizeValue={sanitizeRichText}
							/>
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

PermissionsFormPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>;
