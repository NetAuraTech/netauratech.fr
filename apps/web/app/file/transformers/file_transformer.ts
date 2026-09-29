import { BaseTransformer } from '@adonisjs/core/transformers';
import i18nManager from '@adonisjs/i18n/services/main';
import { resolveFileForRender } from '#file/services/file_resolver';
import { classifyFileType } from '#file/services/file_type';
import { StorageService } from '#file/services/storage_service';
import type { File } from '#file/domain/file';

/**
 * Options passed to the transformer when producing a render-ready prop.
 * When a display intent is present the output carries the resolved alt and
 * responsive variants; without one the transformer keeps the lean admin/API
 * shape.
 */
export interface FileTransformOptions {
	locale?: string;
	altKey?: string | null;
	altOverride?: string | null;
}

/**
 * Transforms a file domain object into its render-ready prop shape.
 *
 * With a display intent (locale / alt key / alt override) the output carries
 * the resolved alt, dimensions and responsive variants; without one it keeps
 * the lean admin/API shape.
 */
export default class FileTransformer extends BaseTransformer<File> {
	protected storageService: StorageService;
	/**
	 * Create the transformer for a file domain object.
	 *
	 * @param file - The file to transform.
	 * @param options - Display intent (locale, alt key, alt override); when
	 * absent the transformer keeps the lean admin/API shape.
	 */
	constructor(
		file: File,
		protected options: FileTransformOptions = {},
	) {
		super(file);
		this.storageService = new StorageService();
	}
	/**
	 * Build the file payload.
	 *
	 * With a display intent the output carries the resolved alt, dimensions,
	 * and responsive variants; without one it falls back to the locale-based
	 * default alt and the MIME-based type classification.
	 */
	async toObject() {
		const hasIntent = Boolean(this.options.locale || this.options.altKey || this.options.altOverride);

		const base = {
			id: this.resource.id.value,
			filename: this.resource.filename,
			originalName: this.resource.originalName,
			mimeType: this.resource.mimeType,
			folderId: this.resource.folderId,
			alts: this.resource.getAlts().map((alt) => ({ locale: alt.locale, key: alt.key, value: alt.value })),
			extension: this.resource.extension,
			createdAt: this.resource.createdAt,
			size: this.resource.size,
			url: await this.storageService.url(this.resource.path, this.resource.disk),
		};

		const resolved = hasIntent ? await resolveFileForRender(this.resource, this.options) : null;

		return {
			...base,
			type: resolved?.type ?? classifyFileType(this.resource.mimeType),
			alt:
				resolved?.alt ?? this.resource.resolveAlt(this.options.locale ?? 'en', i18nManager.defaultLocale, null, null),
			width: resolved?.width,
			height: resolved?.height,
			variants: resolved?.variants,
		};
	}
}
