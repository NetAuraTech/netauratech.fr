import { belongsTo, computed, hasMany, scope } from '@adonisjs/lucid/orm';
import { FileFolderSchema } from '#database/schema';
import { FileFolder as FileFolderDomain } from '#file/domain/file_folder';
import File from '#file/models/file';
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations';

export default class FileFolder extends FileFolderSchema {
	@belongsTo(() => FileFolder, { foreignKey: 'parentId' })
	declare parent: BelongsTo<typeof FileFolder>;

	@hasMany(() => FileFolder, { foreignKey: 'parentId' })
	declare children: HasMany<typeof FileFolder>;

	@hasMany(() => File, { foreignKey: 'folderId' })
	declare files: HasMany<typeof File>;

	static roots = scope((query) => {
		query.whereNull('parent_id');
	});

	/**
	 * Check if folder is a root (has no parent)
	 */
	@computed()
	get isRoot(): boolean {
		return this.toDomain().isRoot();
	}

	/**
	 * Project this model onto its pure domain representation. The root
	 * invariant lives on the domain object; the getters above are thin
	 * delegations.
	 */
	toDomain(): FileFolderDomain {
		return FileFolderDomain.fromModel({
			id: this.id,
			name: this.name,
			parentId: this.parentId,
		});
	}
}
