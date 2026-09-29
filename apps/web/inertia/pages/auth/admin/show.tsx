import { SharedProps } from '@adonisjs/inertia/types';
import { AdminMain } from '@foundry/design-system/admin-main';
import { Button } from '@foundry/design-system/button';
import { Card } from '@foundry/design-system/card';
import { Heading } from '@foundry/design-system/heading';
import { Icon } from '@foundry/design-system/icon';
import { Separator } from '@foundry/design-system/separator';
import { UserStatus } from '@foundry/design-system/user-status';
import { Data } from '@generated/data';
import { usePage } from '@inertiajs/react';
import { ReactElement } from 'react';
import { urlFor } from '~/client';
import { CanAccess } from '~/guards/can_access';
import { getIcon } from '~/helpers/oauth';
import { toUserStatusKind } from '~/helpers/user_status';
import { useMenu } from '~/hooks/use_admin';
import { Lang, useTranslation } from '~/hooks/use_translation';
import Layout from '~/layouts/admin';
import { capitalize } from '~/lib/string';
import type { OAuthProvider } from '#auth/types/auth';
import type { AdminUsersShowTranslations } from '#transport/identity/helpers/i18n_payloads/users_show';

type PageProps = {
	user: Data.Identity.User;
	providers: OAuthProvider[];
	permissions: Data.Identity.Permission[];
	translations: AdminUsersShowTranslations;
};

export default function UsersShowPage(props: PageProps) {
	const { user, providers, permissions, translations } = props;
	const pageProps = usePage<SharedProps>().props;
	const { t, format } = useTranslation(translations);

	const { getEntryIcon } = useMenu();

	const permissionsByCategory =
		permissions?.reduce<Record<string, Data.Identity.Permission[]>>((acc, permission: Data.Identity.Permission) => {
			if (!acc[permission.category]) {
				acc[permission.category] = [];
			}
			acc[permission.category].push(permission);
			return acc;
		}, {}) || {};

	return (
		<AdminMain title={t('title', { username: user.username })} icon={getEntryIcon('admin.identity.users.render')}>
			<Card
				header={
					<div className="flex items-center justify-between gap-3">
						<CanAccess permission="users.view">
							<Button variant="icon" href={urlFor('admin.identity.users.render')} title={t('title')} fitContent>
								<Icon name="ArrowLeft" />
							</Button>
						</CanAccess>
						<div className="flex gap-3">
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
								<Button
									variant="icon_danger"
									href={urlFor('admin.identity.users.destroy', { id: user.id })}
									title={t('actions.delete', { username: user.username })}
									fitContent
								>
									<Icon name="Trash" size={18} />
								</Button>
							</CanAccess>
						</div>
					</div>
				}
			>
				<div className="grid gap-3">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
						<div className="grid gap-3">
							<Heading level={3}>{t('info.value')}</Heading>
							<Separator />
							<div className="grid">
								<span className="font-bold">{t('info.email')}</span>
								<span className="flex gap-2 items-center text-ink-muted">
									{user.email}{' '}
									<UserStatus
										status={toUserStatusKind(user.status)}
										label={t(`status.${toUserStatusKind(user.status)}`)}
									/>
								</span>
							</div>
							<div className="grid">
								<span className="font-bold">{t('info.username')}</span>
								<span className="text-ink-muted">{user.username}</span>
							</div>
						</div>
						<div className="grid gap-3">
							<Heading level={3}>{t('history.value')}</Heading>
							<Separator />
							{user.createdAt && (
								<div className="grid">
									<span className="font-bold">{t('history.created_at')}</span>
									<span className="text-ink-muted">
										{format(new Date(user.createdAt), 'medium', pageProps.locale as Lang)}
									</span>
								</div>
							)}
							{user.updatedAt && (
								<div className="grid">
									<span className="font-bold">{t('history.updated_at')}</span>
									<span className="text-ink-muted">
										{format(new Date(user.updatedAt), 'medium', pageProps.locale as Lang)}
									</span>
								</div>
							)}
							{user.emailVerifiedAt && (
								<div className="grid">
									<span className="font-bold">{t('history.verified_at')}</span>
									<span className="text-ink-muted">
										{format(new Date(user.emailVerifiedAt), 'medium', pageProps.locale as Lang)}
									</span>
								</div>
							)}
						</div>
						<div className="grid gap-3">
							<Heading level={3}>{t('providers.value')}</Heading>
							<Separator />
							{providers.map((provider) => {
								const isConnected = user.connectedProviders[provider];

								return (
									<div key={provider} className="flex items-center justify-between py-1.5">
										<div className="flex items-center gap-3">
											{getIcon(provider)}
											<div>
												<p className="text-sm font-medium text-ink">{capitalize(provider)}</p>
												<p className={`text-xs ${isConnected ? 'text-success' : 'text-ink-muted'}`}>
													{isConnected ? t('providers.connected') : t('providers.not_connected')}
												</p>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
					<div className="grid gap-3">
						<Heading level={3}>{t('roles.value')}</Heading>
						<Separator />
						<div className="grid">
							<span className="font-bold">{t('roles.current')}</span>
							<span className="text-ink-muted">{t(user.role?.name as any)}</span>
						</div>
						<span className="text-ink-muted">
							{t('permissions.value', {
								amount: `${user?.permissions?.length || 0}/${permissions.length}`,
							})}
						</span>
						{Object.keys(permissionsByCategory).length > 0 &&
							Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
								const ownedCount = categoryPermissions.filter((p) => user.permissions?.includes(p.slug)).length;

								return (
									<div key={category} className="border border-edge rounded">
										<span className="flex font-bold p-3">
											{t(category as any)}{' '}
											<span className="font-normal text-ink-muted ml-1">
												({' '}
												<span className={ownedCount === categoryPermissions.length ? 'text-success' : 'text-warning'}>
													{ownedCount}
												</span>
												/{categoryPermissions.length})
											</span>
										</span>
										<div className="p-3 grid gap-2">
											{categoryPermissions.map((permission) => {
												const hasPermission = user.permissions?.includes(permission.slug);
												return (
													<span
														key={permission.slug}
														className={`flex gap-2 items-center text-ink-muted ${hasPermission ? '' : 'opacity-40'}`}
													>
														<Icon
															name={hasPermission ? 'Check' : 'X'}
															className={hasPermission ? 'text-success' : 'text-ink-subtle'}
															size={16}
														/>
														<span className={hasPermission ? '' : 'text-ink-muted'}>{t(permission.name as any)}</span>
													</span>
												);
											})}
										</div>
									</div>
								);
							})}
					</div>
				</div>
			</Card>
		</AdminMain>
	);
}

UsersShowPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>;
