import { FileFolder } from '#file/domain/file_folder';

interface FolderRow {
	id: number;
	name: string;
	parentId: number | null;
}

/**
 * Build the folder tree from flat rows in a single pass.
 *
 * Groups the rows by `parentId`, preserving the input order within each level
 * (callers order the rows by name), and hydrates each node with its
 * domain-hydrated children. The folder queries use this instead of the
 * transformer's recursive relation loads, so the whole subtree is produced
 * from one query.
 *
 * @param rows - The flat folder rows covering the desired subtree.
 * @param rootParentId - The parent id of the returned forest. `null` returns
 *   the top-level roots.
 * @returns The forest rooted at `rootParentId`, children nested in input order.
 */
export function buildFolderForest(rows: FolderRow[], rootParentId: number | null = null): FileFolder[] {
	const childrenByParent = new Map<number | null, FolderRow[]>();
	for (const row of rows) {
		const siblings = childrenByParent.get(row.parentId) ?? [];
		siblings.push(row);
		childrenByParent.set(row.parentId, siblings);
	}

	const build = (parentId: number | null): FileFolder[] =>
		(childrenByParent.get(parentId) ?? []).map((row) => FileFolder.fromModel(row, build(row.id)));

	return build(rootParentId);
}

/**
 * Find a folder node in a built forest by its id, depth-first.
 *
 * @param folders - The forest to search.
 * @param id - The folder primary key to look up.
 * @returns The matching node, or `null` when absent.
 */
export function findFolder(folders: readonly FileFolder[], id: number): FileFolder | null {
	for (const folder of folders) {
		if (folder.id.value === id) {
			return folder;
		}

		const found = findFolder(folder.children, id);
		if (found) {
			return found;
		}
	}

	return null;
}
