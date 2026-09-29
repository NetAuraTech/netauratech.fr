import { inject } from '@adonisjs/core';
import { BackupMetadata } from '#backup/domain/backup';
import { ListBackupsQuery } from '#backup/queries/list_backups_query';
import type { BackupType } from '#backup/types/backup';

interface ListBackupsPayload {
	type?: BackupType;
}

/**
 * List all backup files from storage, optionally filtered by type.
 */
@inject()
export class ListBackupsAction {
	constructor(protected listBackupsQuery: ListBackupsQuery) {}

	/**
	 * Execute backup listing.
	 *
	 * @param payload - Optional filter to return only full or differential backups.
	 * @returns An array of {@link BackupMetadata} sorted newest first, or an empty array if no backups exist.
	 *
	 * @example
	 * const backups = await listBackupsAction.execute({ type: 'full' })
	 */
	async execute(payload?: ListBackupsPayload): Promise<BackupMetadata[]> {
		const backups = await this.listBackupsQuery.execute();

		if (payload?.type) {
			return backups.filter((backup) => backup.type === payload.type);
		}

		return backups;
	}
}
