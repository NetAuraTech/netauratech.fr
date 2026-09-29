import { Form } from '@adonisjs/inertia/react';
import { SharedProps } from '@adonisjs/inertia/types';
import { AdminMain } from '@foundry/design-system/admin-main';
import { Badge } from '@foundry/design-system/badge';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Heading } from '@foundry/design-system/heading';
import { Icon } from '@foundry/design-system/icon';
import { Separator } from '@foundry/design-system/separator';
import Table from '@foundry/design-system/table';
import { Data } from '@generated/data';
import { ReactElement } from 'react';
import { actionFor, urlFor } from '~/client';
import { CanAccess } from '~/guards/can_access';
import { permissionCategoryKey } from '~/helpers/permissions';
import { useMenu } from '~/hooks/use_admin';
import { useTranslation } from '~/hooks/use_translation';
import Layout from '~/layouts/admin';
import type { AdminRolesShowTranslations } from '#transport/identity/helpers/i18n_payloads/roles_show';

type PageProps = {
	role: Data.Identity.Role;
	translations: AdminRolesShowTranslations;
};

export default function RolesShowPage(props: PageProps) {
	const { role, translations } = props;
	const { t } = useTranslation(translations);

	const { getEntryIcon } = useMenu();

	const roleName = t(`roles.${role.slug}.value` as any);

	const permissionsByCategory = (role.permissions ?? []).reduce<Record<string, Data.Identity.Permission[]>>(
		(acc, permission) => {
			const category = permissionCategoryKey(permission.category);
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(permission);
			return acc;
		},
		{},
	);

	return (
		<AdminMain title={t('title', { name: roleName })} icon={getEntryIcon('admin.identity.roles.render')}>
			<Card
				header={
					<div className="flex items-center justify-between gap-3">
						<CanAccess permission="roles.view">
							<Button variant="icon" href={urlFor('admin.identity.roles.render')} title={t('actions.list')} fitContent>
								<Icon name="ArrowLeft" />
							</Button>
						</CanAccess>
						{!role.isSystem && (
							<div className="flex gap-3">
								<CanAccess permission="roles.update">
									<Button
										variant="icon_warning"
										href={urlFor('admin.identity.roles_update.render', { id: role.id })}
										title={t('actions.edit', { name: roleName })}
										fitContent
									>
										<Icon name="Pen" size={18} />
									</Button>
								</CanAccess>
								<CanAccess permission="roles.delete">
									<Form
										action={actionFor('admin.identity.roles.destroy', { id: role.id })}
										onBefore={() => {
											return window.confirm(t('delete.confirm', { name: roleName }));
										}}
									>
										<Button variant="icon_danger" title={t('actions.delete', { name: roleName })} fitContent>
											<Icon name="Trash" size={18} />
										</Button>
									</Form>
								</CanAccess>
							</div>
						)}
					</div>
				}
			>
				<div className="grid gap-3">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
						<div className="grid gap-3">
							<Heading level={3}>{t('name.value')}</Heading>
							<Separator />
							<div className="grid">
								<span className="flex items-center gap-2">
									{roleName}
									{role.isSystem && (
										<Badge variant="info" title={t('system.hint')}>
											{t('system.value')}
										</Badge>
									)}
								</span>
								<span className="text-xs text-ink-muted">{t(`roles.${role.slug}.description` as any)}</span>
							</div>
						</div>
						<div className="grid gap-3">
							<Heading level={3}>{t('slug.value')}</Heading>
							<Separator />
							<span>{role.slug}</span>
						</div>
					</div>

					<div className="grid gap-3">
						<Heading level={3}>{t('permissions.value')}</Heading>
						<Separator />
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
							{Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
								<div key={`category-${category}`} className="grid gap-2">
									<span className="font-semibold">{t(`permissions.categories.${category}` as any)}</span>
									<ul className="grid gap-1">
										{categoryPermissions.map((permission) => (
											<li
												key={`permission-${permission.id}`}
												title={t(`permissions.items.${permission.slug}.description` as any)}
											>
												{t(`permissions.items.${permission.slug}.value` as any)}
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>

					<div className="grid gap-3">
						<Heading level={3}>{t('users.value')}</Heading>
						<Separator />
						<Table>
							<Table.Header>
								<Table.Row>
									<Table.HeaderCell>{t('users.table.username')}</Table.HeaderCell>
									<Table.HeaderCell>{t('users.table.email')}</Table.HeaderCell>
									<Table.HeaderCell>{t('users.actions')}</Table.HeaderCell>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{(role.users ?? []).length === 0 ? (
									<Table.Row>
										<Table.Cell colSpan={3} className="text-center! p-12!">
											{t('users.empty')}
										</Table.Cell>
									</Table.Row>
								) : (
									(role.users ?? []).map((user) => (
										<Table.Row key={`user-${user.id}`}>
											<Table.Cell data-label={t('users.table.username')}>{user.username}</Table.Cell>
											<Table.Cell data-label={t('users.table.email')}>{user.email}</Table.Cell>
											<Table.Cell data-label={t('users.actions')}>
												<div className="flex items-center w-full py-4 gap-2">
													<CanAccess permission="users.view">
														<Button
															variant="icon_info"
															href={urlFor('admin.identity.users_show.render', { id: user.id })}
															title={t('users.show', { username: user.username })}
															fitContent
														>
															<Icon name="Eye" size={18} />
														</Button>
													</CanAccess>
												</div>
											</Table.Cell>
										</Table.Row>
									))
								)}
							</Table.Body>
						</Table>
					</div>
				</div>
			</Card>
		</AdminMain>
	);
}

RolesShowPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>;
