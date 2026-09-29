import { Entity } from '#core/domain/entity';
import { FileFolderIdentifier } from '#file/domain/identifiers';

/**
 * Pure domain object for a file folder.
 *
 * A {@link FileFolder} is a node in the folder tree: folders may nest under a
 * parent folder, and a folder with no parent is a root. The Lucid `FileFolder`
 * model is the persistence representation; hydrate one from a model with
 * {@link FileFolder.fromModel}.
 */
export class FileFolder extends Entity<{
	id: FileFolderIdentifier;
	name: string;
	parentId: number | null;
	children: readonly FileFolder[];
}> {
	private constructor(
		readonly id: FileFolderIdentifier,
		readonly name: string,
		readonly parentId: number | null,
		readonly children: readonly FileFolder[] = [],
	) {
		super({ id, name, parentId, children });
	}

	/**
	 * Hydrate a domain folder from its Lucid model representation.
	 *
	 * @param model - The persisted folder.
	 * @param children - The direct child folders, already domain-hydrated.
	 *   Defaults to an empty array when the subtree is not loaded.
	 */
	static fromModel(
		model: { id: number; name: string; parentId: number | null },
		children: readonly FileFolder[] = [],
	): FileFolder {
		return new FileFolder(FileFolderIdentifier.of(model.id), model.name, model.parentId, children);
	}

	/** Whether this folder is a root (has no parent). */
	isRoot(): boolean {
		return this.parentId === null;
	}
}
