import { inject } from '@adonisjs/core';
import { FileFolderRepository } from '#file/repositories/file_folder_repository';
import { FileRepository } from '#file/repositories/file_repository';
import type { DashboardCollector, DashboardCollectorPayload, DashboardFileSection } from '#core/types/dashboard';

/**
 * Contributes the file section of the admin dashboard: file and folder
 * counts, the per-folder breakdown, and the recent upload activity.
 *
 * Read-only: figures come from dedicated repository aggregates and a bounded
 * recent-items query — no full table loads — so the dashboard stays cheap as
 * data grows.
 */
@inject()
export class FileDashboardCollector implements DashboardCollector<'file'> {
	constructor(
		protected fileRepository: FileRepository,
		protected fileFolderRepository: FileFolderRepository,
	) {}

	/**
	 * Collect the file dashboard section.
	 *
	 * @param payload - Recent-activity list limit forwarded by the stats action.
	 * @returns The file figures and the recent upload activity.
	 */
	async collect(payload: DashboardCollectorPayload): Promise<DashboardFileSection> {
		const [files, fileFolders, filesByFolder, recentFiles] = await Promise.all([
			this.fileRepository.count(),
			this.fileFolderRepository.count(),
			this.fileFolderRepository.listWithFileCounts(),
			this.fileRepository.listRecent(payload.recentLimit),
		]);

		return {
			files,
			fileFolders,
			filesByFolder,
			recentFiles: recentFiles.map((file) => ({
				id: file.id,
				originalName: file.originalName,
				mimeType: file.mimeType,
				size: Number(file.size),
				createdAt: file.createdAt,
			})),
		};
	}
}
