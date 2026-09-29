import { Form } from '@adonisjs/inertia/react';
import { SharedProps } from '@adonisjs/inertia/types';
import { AdminMain } from '@foundry/design-system/admin-main';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Field } from '@foundry/design-system/field';
import { Icon } from '@foundry/design-system/icon';
import { Pagination } from '@foundry/design-system/pagination';
import { SelectOption } from '@foundry/design-system/select';
import Table from '@foundry/design-system/table';
import { UserStatus } from '@foundry/design-system/user-status';
import { Data } from '@generated/data';
import { usePage } from '@inertiajs/react';
import { ReactElement } from 'react';
import { actionFor, urlFor } from '~/client';
import { CanAccess } from '~/guards/can_access';
import { sanitizeText } from '~/helpers/sanitization';
import { toUserStatusKind } from '~/helpers/user_status';
import { useMenu } from '~/hooks/use_admin';
import { Lang, useTranslation } from '~/hooks/use_translation';
import Layout from '~/layouts/admin';
import { Paginated } from '~/types/paginated';
import type { AdminUsersIndexTranslations } from '#transport/identity/helpers/i18n_payloads/users_list';

type PageProps = {
	users: Paginated<Data.Identity.User>;
	roles: Data.Identity.Role[];
	filters: {
		search?: string;
		role?: string;
	};
	translations: AdminUsersIndexTranslations;
};

export default function UsersIndexPage(props: PageProps) {
	const { users, roles, filters, translations } = props;
	const pageProps = usePage<SharedProps>().props;
	const { t, format } = useTranslation(translations);
	const { t: commonT } = useTranslation(pageProps.common_translations);

	const { getEntryIcon } = useMenu();

	return (
		<AdminMain
			title={t('title')}
			icon={getEntryIcon('admin.identity.users.render')}
			action={
				<CanAccess permission="users.create">
					<Button href={urlFor('admin.identity.users_create.render')} variant="secondary" fitContent>
						{t('action')}
					</Button>
				</CanAccess>
			}
		>
			<Card
				header={
					<Form
						action={actionFor('admin.identity.users.render')}
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
						<Field
							type="select"
							name="role"
							label={t('roles.value', { count: 1 })}
							placeholder={t('roles.placeholder')}
							defaultValue={filters.role}
							sanitizeValue={sanitizeText}
						>
							{roles &&
								roles.map((role) => (
									<SelectOption key={`role-${role.id}`} label={t(role.name as any)} value={role.id} />
								))}
						</Field>
						<Button type="submit" fitContent>
							{t('search.filter')}
						</Button>
					</Form>
				}
				footer={
					<Pagination
						buildHref={(page) => urlFor('admin.identity.users.render', undefined, { qs: { ...filters, page } })}
						filters={filters}
						metadata={users.metadata}
						summaryText={(start, end, total) => commonT('pagination.showing', { start, end, total })}
						previousTitle={commonT('pagination.previous')}
						nextTitle={commonT('pagination.next')}
					/>
				}
			>
				<Table>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>{t('value', { count: 1 })}</Table.HeaderCell>
							<Table.HeaderCell>{t('roles.value', { count: 1 })}</Table.HeaderCell>
							<Table.HeaderCell>{t('status.value')}</Table.HeaderCell>
							<Table.HeaderCell>{t('register_on')}</Table.HeaderCell>
							<Table.HeaderCell>{t('actions.value')}</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{users.data.length === 0 ? (
							<Table.Row>
								<Table.Cell colSpan={5} className="text-center! p-12!">
									{t('empty')}
								</Table.Cell>
							</Table.Row>
						) : (
							users.data.map((user) => (
								<Table.Row key={`user-${user.id}`}>
									<Table.Cell className="flex flex-row" data-label={t('value', { count: 1 })}>
										<span className="flex">{user.username}</span>
										<span className="flex text-ink-muted">{user.email}</span>
									</Table.Cell>
									<Table.Cell data-label={t('roles.value', { count: 1 })}>
										<span className="px-4 py-1 rounded border border-secondary bg-secondary-light/20 text-secondary">
											{user.role?.name ? t(user.role.name as any) : '—'}
										</span>
									</Table.Cell>
									<Table.Cell data-label={t('status.value')}>
										<UserStatus
											status={toUserStatusKind(user.status)}
											label={t(`status.${toUserStatusKind(user.status)}`)}
										/>
									</Table.Cell>
									<Table.Cell data-label={t('register_on')}>
										{format(new Date(user.createdAt!), 'medium', pageProps.locale as Lang)}
									</Table.Cell>
									<Table.Cell data-label={t('actions.value')}>
										<div className="flex items-center w-full py-4 gap-2">
											<CanAccess permission="users.view">
												<Button
													variant="icon_info"
													href={urlFor('admin.identity.users_show.render', { id: user.id })}
													title={t('actions.show', { username: user.username })}
													fitContent
												>
													<Icon name="Eye" size={18} />
												</Button>
											</CanAccess>
											<CanAccess permission="users.update">
												<Button
													variant="icon_warning"
													href={urlFor('admin.identity.users_update.render', { id: user.id })}
													title={t('actions.edit', { username: user.username })}
													fitContent
												>
													<Icon name="Pen" size={18} />
												</Button>
											</CanAccess>
											<CanAccess permission="users.delete">
												<Form action={actionFor('admin.identity.users.destroy', { id: user.id })}>
													<Button
														variant="icon_danger"
														title={t('actions.delete', { username: user.username })}
														fitContent
													>
														<Icon name="Trash" size={18} />
													</Button>
												</Form>
											</CanAccess>
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

UsersIndexPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>;
