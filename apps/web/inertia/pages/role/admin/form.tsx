import { Form } from '@adonisjs/inertia/react';
import { SharedProps } from '@adonisjs/inertia/types';
import { AdminMain } from '@foundry/design-system/admin-main';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Checkbox } from '@foundry/design-system/checkbox';
import { Field } from '@foundry/design-system/field';
import { Heading } from '@foundry/design-system/heading';
import { Icon } from '@foundry/design-system/icon';
import { Paragraph } from '@foundry/design-system/paragraph';
import { Data } from '@generated/data';
import { ReactElement } from 'react';
import { actionFor, urlFor } from '~/client';
import { CanAccess } from '~/guards/can_access';
import { permissionCategoryKey } from '~/helpers/permissions';
import { sanitizeRichText, sanitizeText } from '~/helpers/sanitization';
import { rules } from '~/helpers/validation_rules';
import { useMenu } from '~/hooks/use_admin';
import { useFormValidation } from '~/hooks/use_form_validation';
import { useTranslation } from '~/hooks/use_translation';
import Layout from '~/layouts/admin';
import type { AdminRolesFormTranslations } from '#transport/identity/helpers/i18n_payloads/roles_form';

type PageProps = {
	role: Data.Identity.Role | null;
	permissions: Data.Identity.Permission[];
	translations: AdminRolesFormTranslations;
};

export default function RolesFormPage(props: PageProps) {
	const { role, permissions, translations } = props;
	const { t } = useTranslation(translations);

	const isEditing = role !== null;

	const { getEntryIcon } = useMenu();

	const validation = useFormValidation({
		name: [rules.required(t('name.value')), rules.minLength(2, t('name.value')), rules.maxLength(100, t('name.value'))],
		slug: [
			rules.required(t('slug.value')),
			rules.minLength(2, t('slug.value')),
			rules.maxLength(50, t('slug.value')),
			rules.pattern(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, 'slug_format'),
		],
		description: [rules.maxLength(255, t('description.value'))],
	});

	const assignedPermissionIds = new Set((role?.permissions ?? []).map((permission) => permission.id));

	const permissionsByCategory = permissions.reduce<Record<string, Data.Identity.Permission[]>>((acc, permission) => {
		const category = permissionCategoryKey(permission.category);
		if (!acc[category]) {
			acc[category] = [];
		}
		acc[category].push(permission);
		return acc;
	}, {});

	return (
		<AdminMain
			title={isEditing ? t('title.edit', { name: role.name }) : t('title.create')}
			icon={getEntryIcon('admin.identity.roles.render')}
		>
			<Card
				header={
					<div className="flex items-center justify-between gap-3">
						<CanAccess permission="roles.view">
							<Button variant="icon" href={urlFor('admin.identity.roles.render')} title={t('actions.list')} fitContent>
								<Icon name="ArrowLeft" />
							</Button>
						</CanAccess>
					</div>
				}
			>
				<Form
					action={
						isEditing
							? actionFor('admin.identity.roles_update.execute', { id: role.id })
							: actionFor('admin.identity.roles_create.execute')
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
								defaultValue={role?.name}
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
								defaultValue={role?.slug}
								placeholder={t('slug.placeholder')}
								validation={validation}
								errors={errors}
								required
								sanitizeValue={sanitizeText}
							/>
							<Field
								label={t('description.value')}
								name="description"
								type="textarea"
								defaultValue={role?.description ?? ''}
								placeholder={t('description.placeholder')}
								validation={validation}
								errors={errors}
								sanitizeValue={sanitizeRichText}
							/>
							<div className="grid gap-3">
								<Heading level={3}>{t('permissions.value')}</Heading>
								<div className="grid gap-4">
									{Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
										<fieldset key={`category-${category}`} className="grid gap-2">
											<legend className="font-semibold">{t(`permissions.categories.${category}` as any)}</legend>
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
												{categoryPermissions.map((permission) => (
													/*
													 * Implicit label association: the Checkbox atom forces
													 * `id = name`, so per-item `htmlFor` is impossible when
													 * several checkboxes share the `permission_ids[]` name
													 * (bracket notation is required for Inertia to collect
													 * the values into an array).
													 */
													<label key={`permission-${permission.id}`} className="flex items-center gap-2">
														<Checkbox
															name="permission_ids[]"
															value={permission.id}
															checked={assignedPermissionIds.has(permission.id)}
														/>
														<span>{t(`permissions.items.${permission.slug}.value` as any)}</span>
													</label>
												))}
											</div>
										</fieldset>
									))}
								</div>
								<Paragraph className="text-ink-muted text-sm">{t('permissions.system_hint')}</Paragraph>
							</div>
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

RolesFormPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>;
