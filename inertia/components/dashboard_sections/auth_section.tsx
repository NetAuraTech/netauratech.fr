import { CanAccess } from '~/guards/can_access'
import { useTranslation } from '~/hooks/use_translation'
import { StatCard } from '~/components/dashboard_sections/stat_card'
import { registerDashboardSection, type DashboardSectionCardProps } from '~/lib/dashboard_sections'
import type { DashboardAuthSection } from '#types/dashboard'

/**
 * Auth dashboard section card: total users and the users-by-role breakdown.
 *
 * Registered into the client-side section registry at module load. The admin
 * dashboard page renders it only when the `auth` section is present in the
 * payload, so a flavor pruned of nothing else still shows it.
 */
function AuthStatCard({ stats, translations }: DashboardSectionCardProps) {
  const { t } = useTranslation(translations)
  const auth: DashboardAuthSection | undefined = stats.auth

  if (!auth) return null

  return (
    <CanAccess permission="users.view">
      <StatCard icon="Users" label={t('cards.users')} value={auth.users} route="admin.users.render">
        {auth.usersByRole.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {auth.usersByRole.map((role) => (
              <span key={role.name ?? 'no-role'} className="text-ink-muted">
                {`${role.count} ${role.name ?? t('cards.no_role')}`}
              </span>
            ))}
          </div>
        )}
      </StatCard>
    </CanAccess>
  )
}

registerDashboardSection('auth', { Stat: AuthStatCard })
