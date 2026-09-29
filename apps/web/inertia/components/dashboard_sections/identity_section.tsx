import { urlFor } from '~/client';
import { StatCard } from '~/components/dashboard_sections/stat_card';
import { CanAccess } from '~/guards/can_access';
import { useTranslation } from '~/hooks/use_translation';
import { registerDashboardSection, type DashboardSectionCardProps } from '~/lib/dashboard_sections';
import type { DashboardIdentitySection } from '#core/types/dashboard';

/**
 * Identity dashboard section card: total users and the users-by-role
 * breakdown.
 *
 * Registered into the client-side section registry at module load. The admin
 * dashboard page renders it only when the `identity` section is present in
 * the payload, so a flavor pruned of nothing else still shows it.
 */
function IdentityStatCard({ stats, translations }: DashboardSectionCardProps) {
	const { t } = useTranslation(translations);
	const identity: DashboardIdentitySection | undefined = stats.identity;

	if (!identity) return null;

	return (
		<CanAccess permission="users.view">
			<StatCard
				icon="Users"
				label={t('cards.users')}
				value={identity.users}
				href={urlFor('admin.identity.users.render')}
			>
				{identity.usersByRole.length > 0 && (
					<div className="mt-4 flex flex-wrap gap-2 text-sm">
						{identity.usersByRole.map((role) => (
							<span key={role.name ?? 'no-role'} className="text-ink-muted">
								{`${role.count} ${role.name ?? t('cards.no_role')}`}
							</span>
						))}
					</div>
				)}
			</StatCard>
		</CanAccess>
	);
}

registerDashboardSection('identity', { Stat: IdentityStatCard });
