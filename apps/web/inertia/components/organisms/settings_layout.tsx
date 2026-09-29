import { Heading } from '@foundry/design-system/heading';
import { NavLink } from '@foundry/design-system/nav-link';
import { Paragraph } from '@foundry/design-system/paragraph';
import { Section } from '@foundry/design-system/section';
import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';
import { actionFor, urlFor } from '~/client';
import { CanAccess } from '~/guards/can_access';
import { useNavLinkActive } from '~/hooks/use_nav_link_active';
import { useTranslation } from '~/hooks/use_translation';
import type { TranslationNodes } from '#transport/core/helpers/translation_tree';

const tabs = [
	{ id: 'profile', label: 'header.tabs.profile', route: 'account.profile.render' },
	{ id: 'account', label: 'header.tabs.account', route: 'account.account.render' },
	{ id: 'preferences', label: 'header.tabs.preferences', route: 'account.preferences.render' },
] as const;

function SettingsTab(props: { label: string; route: (typeof tabs)[number]['route'] }) {
	const href = urlFor(props.route);

	return <NavLink href={href} isActive={useNavLinkActive(href)} label={props.label} variant="setting_nav" />;
}

interface PageProps {
	/** The active tab identifier — used externally to set the page context. */
	tab: (typeof tabs)[number]['id'];
	/** Page-specific content rendered inside the settings grid. */
	children: ReactNode;
	translations: TranslationNodes;
}

/**
 * Shared layout for all settings pages.
 *
 * Renders a centred page title, a horizontal tab bar, and a content grid.
 * The tab bar is split into two groups:
 *
 * - **Left** — the three main settings tabs (Profile, Account, Preferences),
 *   always visible.
 * - **Right** — contextual actions: an Admin link guarded by the
 *   `admin.access` permission (hidden for regular users) and a Logout link.
 *
 * Active tab highlighting is handled by `<NavLink variant="setting_nav">`,
 * which applies a bottom-border indicator when `aria-current="page"` is set.
 *
 * The page title and subtitle are read from the `settings` i18n namespace
 * (`header.title`, `header.sub_title`).
 *
 * @example
 * // Used as the layout wrapper for each settings page component
 * export default function ProfilePage() {
 *   return (
 *     <SettingsLayout tab="profile">
 *       <Card title="Profile">...</Card>
 *     </SettingsLayout>
 *   )
 * }
 */
export function SettingsLayout(props: PageProps) {
	const { children, translations } = props;

	const { t } = useTranslation(translations);

	const adminHref = urlFor('admin.core.dashboard.render');
	const adminActive = useNavLinkActive(adminHref);
	// Resolve the route's own HTTP method from the registry: logout is a
	// state-changing POST, so the tab must submit a POST visit rather than a
	// GET navigation (a bare `urlFor()` string would default to GET).
	const logoutAction = actionFor('auth.session.destroy');
	const logoutActive = useNavLinkActive(logoutAction.url);

	return (
		<>
			<Head title={t('header.title')} />
			<Section>
				<div className="container">
					<div className="text-center mb-8">
						<Heading level={1}>{t('header.title')}</Heading>
						<Paragraph variant="muted" spacing="sm">
							{t('header.sub_title')}
						</Paragraph>
					</div>
					<div className="flex gap-1 justify-between border-b border-edge mb-8">
						<div className="flex gap-1">
							{tabs.map((tab) => (
								<SettingsTab key={tab.id} label={t(tab.label)} route={tab.route} />
							))}
						</div>
						<div className="flex gap-1">
							<CanAccess permission={'admin.access'}>
								<NavLink href={adminHref} isActive={adminActive} label={t('header.tabs.admin')} variant="setting_nav" />
							</CanAccess>
							<NavLink
								href={logoutAction.url}
								method={logoutAction.method}
								isActive={logoutActive}
								label={t('header.tabs.logout')}
								variant="setting_nav"
							/>
						</div>
					</div>
					<div className="grid gap-6">{children}</div>
				</div>
			</Section>
		</>
	);
}
