import { BaseTransformer } from '@adonisjs/core/transformers';
import type { FileFolder } from '#file/domain/file_folder';

type FileFolderObject = {
	id: number;
	name: string;
	parentId: number | null;
	children: FileFolderObject[];
};

/**
 * Maps a {@link FileFolder} domain object to a nested tree node,
 * recursively transforming the preloaded children.
 */
export default class FileFolderTransformer extends BaseTransformer<FileFolder> {
	/**
	 * Build the folder node, transforming each preloaded child recursively.
	 */
	async toObject(): Promise<FileFolderObject> {
		const children = await Promise.all(
			this.resource.children.map((child) => new FileFolderTransformer(child).toObject()),
		);

		return {
			id: this.resource.id.value,
			name: this.resource.name,
			parentId: this.resource.parentId,
			children,
		};
	}
}
