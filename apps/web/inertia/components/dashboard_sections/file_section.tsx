import { Paragraph } from '@foundry/design-system/paragraph';
import { urlFor } from '~/client';
import { RecentCard } from '~/components/dashboard_sections/recent_card';
import { StatCard } from '~/components/dashboard_sections/stat_card';
import { CanAccess } from '~/guards/can_access';
import { useTranslation } from '~/hooks/use_translation';
import { registerDashboardSection, type DashboardSectionCardProps } from '~/lib/dashboard_sections';
import type { Data } from '@generated/data';

/**
 * File dashboard section cards: file/folder counts and the recent-uploads
 * activity list.
 *
 * Registered into the client-side section registry at module load. The admin
 * dashboard page renders them only when the `file` section is present in the
 * payload, so a flavor pruned of other domains still shows the file section.
 */
function FileStatCard({ stats, translations }: DashboardSectionCardProps) {
	const { t } = useTranslation(translations);
	const file: Data.Core.Dashboard['file'] = stats.file;

	if (!file) return null;

	return (
		<CanAccess permission="files.view">
			<StatCard icon="Folder" label={t('cards.files')} value={file.files} href={urlFor('admin.file.files.render')}>
				<Paragraph variant="muted" spacing="sm">
					{`${t('cards.folders')}: ${file.fileFolders}`}
				</Paragraph>
				{file.filesByFolder.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-2 text-sm">
						{file.filesByFolder.map((folder) => (
							<span key={folder.id} className="text-ink-muted">
								{`${folder.count} ${folder.name}`}
							</span>
						))}
					</div>
				)}
			</StatCard>
		</CanAccess>
	);
}

function FileRecentCard({ stats, translations, formatDate }: DashboardSectionCardProps) {
	const { t } = useTranslation(translations);
	const file: Data.Core.Dashboard['file'] = stats.file;

	if (!file) return null;

	return (
		<CanAccess permission="files.view">
			<RecentCard
				title={t('recent.uploads')}
				viewAllHref={urlFor('admin.file.files.render')}
				viewAllLabel={t('view_all')}
			>
				{file.recentFiles.length === 0 ? (
					<Paragraph variant="muted" spacing="xs" className="p-6">
						{t('recent.empty')}
					</Paragraph>
				) : (
					<ul className="divide-y divide-edge">
						{file.recentFiles.map((upload) => (
							<li key={upload.id} className="flex items-center justify-between gap-2 px-6 py-3">
								<span className="truncate">
									{upload.originalName} <span className="text-ink-subtle">({upload.mimeType})</span>
								</span>
								<span className="shrink-0 text-sm text-ink-muted">{formatDate(upload.createdAt)}</span>
							</li>
						))}
					</ul>
				)}
			</RecentCard>
		</CanAccess>
	);
}

registerDashboardSection('file', { Stat: FileStatCard, Recent: FileRecentCard });
