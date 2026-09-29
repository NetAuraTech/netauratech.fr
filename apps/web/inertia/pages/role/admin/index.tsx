import { Form } from '@adonisjs/inertia/react';
import { SharedProps } from '@adonisjs/inertia/types';
import { AdminMain } from '@foundry/design-system/admin-main';
import { Badge } from '@foundry/design-system/badge';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Icon } from '@foundry/design-system/icon';
import { Pagination } from '@foundry/design-system/pagination';
import Table from '@foundry/design-system/table';
import { Data } from '@generated/data';
import { usePage } from '@inertiajs/react';
import { ReactElement } from 'react';
import { actionFor, urlFor } from '~/client';
import { CanAccess } from '~/guards/can_access';
import { sanitizeText } from '~/helpers/sanitization';
import { useMenu } from '~/hooks/use_admin';
import { useTranslation } from '~/hooks/use_translation';
import Layout from '~/layouts/admin';
import { Paginated } from '~/types/paginated';
import type { AdminRolesIndexTranslations } from '#transport/identity/helpers/i18n_payloads/roles_list';

type PageProps = {
	roles: Paginated<Data.Identity.Role>;
	filters: {
		search?: string;
	};
	translations: AdminRolesIndexTranslations;
};

export default function RolesIndexPage(props: PageProps) {
	const { roles, filters, translations } = props;
	const pageProps = usePage<SharedProps>().props;
	const { t } = useTranslation(translations);
	const { t: commonT } = useTranslation(pageProps.common_translations);

	const { getEntryIcon } = useMenu();

	return (
		<AdminMain
			title={t('title')}
			icon={getEntryIcon('admin.identity.roles.render')}
			action={
				<CanAccess permission="roles.create">
					<Button href={urlFor('admin.identity.roles_create.render')} variant="secondary" fitContent>
						{t('create.title')}
					</Button>
				</CanAccess>
			}
		>
			<Card
				header={
					<Form
						action={actionFor('admin.identity.roles.render')}
						className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
					>
						<Field
							type="text"
							name="search"
							label={t('search.value')}
							placeholder={t('search.placeholder')}
							defaultValue={filters.search}
							sanitizeValue={sanitizeText}
						/>
						<Button type="submit" fitContent>
							{t('search.filter')}
						</Button>
					</Form>
				}
				footer={
					<Pagination
						buildHref={(page) => urlFor('admin.identity.roles.render', undefined, { qs: { ...filters, page } })}
						filters={filters}
						metadata={roles.metadata}
						summaryText={(start, end, total) => commonT('pagination.showing', { start, end, total })}
						previousTitle={commonT('pagination.previous')}
						nextTitle={commonT('pagination.next')}
					/>
				}
			>
				<Table>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>{t('table.name')}</Table.HeaderCell>
							<Table.HeaderCell>{t('table.slug')}</Table.HeaderCell>
							<Table.HeaderCell>{t('table.permissions')}</Table.HeaderCell>
							<Table.HeaderCell>{t('table.users')}</Table.HeaderCell>
							<Table.HeaderCell>{t('actions.value')}</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{roles.data.length === 0 ? (
							<Table.Row>
								<Table.Cell colSpan={5} className="text-center! p-12!">
									{t('empty')}
								</Table.Cell>
							</Table.Row>
						) : (
							roles.data.map((role: Data.Identity.Role) => (
								<Table.Row key={`role-${role.id}`}>
									<Table.Cell data-label={t('table.name')}>
										<div className="grid">
											<span className="flex items-center gap-2">
												{t(`roles.${role.slug}.value` as any)}
												{role.isSystem && (
													<Badge variant="info" title={t('system.hint')}>
														{t('system.value')}
													</Badge>
												)}
											</span>
											<span className="text-xs text-ink-muted">{t(`roles.${role.slug}.description` as any)}</span>
										</div>
									</Table.Cell>
									<Table.Cell data-label={t('table.slug')}>{role.slug}</Table.Cell>
									<Table.Cell data-label={t('table.permissions')}>{role.permissions?.length ?? 0}</Table.Cell>
									<Table.Cell data-label={t('table.users')}>{role.usersCount ?? 0}</Table.Cell>
									<Table.Cell data-label={t('actions.value')}>
										<div className="flex items-center w-full py-4 gap-2">
											<CanAccess permission="roles.view">
												<Button
													variant="icon_info"
													href={urlFor('admin.identity.roles_show.render', { id: role.id })}
													title={t('actions.show', { name: t(`roles.${role.slug}.value` as any) })}
													fitContent
												>
													<Icon name="Eye" size={18} />
												</Button>
											</CanAccess>
											{!role.isSystem && (
												<>
													<CanAccess permission="roles.update">
														<Button
															variant="icon_warning"
															href={urlFor('admin.identity.roles_update.render', { id: role.id })}
															title={t('actions.edit', {
																name: t(`roles.${role.slug}.value` as any),
															})}
															fitContent
														>
															<Icon name="Pen" size={18} />
														</Button>
													</CanAccess>
													<CanAccess permission="roles.delete">
														<Form
															action={actionFor('admin.identity.roles.destroy', { id: role.id })}
															onBefore={() => {
																return window.confirm(
																	t('delete.confirm', {
																		name: t(`roles.${role.slug}.value` as any),
																	}),
																);
															}}
														>
															<Button
																variant="icon_danger"
																title={t('actions.delete', {
																	name: t(`roles.${role.slug}.value` as any),
																})}
																fitContent
															>
																<Icon name="Trash" size={18} />
															</Button>
														</Form>
													</CanAccess>
												</>
											)}
										</div>
									</Table.Cell>
								</Table.Row>
							))
						)}
					</Table.Body>
				</Table>
			</Card>
		</AdminMain>
	);
}

RolesIndexPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>;
