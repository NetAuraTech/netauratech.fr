/**
 * The set of storage drivers supported by the CMS filesystem.
 * Mirrors the disk keys declared in `config/drive.ts`.
 */
export type StorageDisk = 'fs' | 's3' | 'r2';

/**
 * A file reference embedded in a block's props.
 *
 * `altKey` identifies the named alt entry to resolve from `file_alts`
 * for the current page locale. `altOverride` is an optional inline
 * alt text that bypasses the named system entirely — use it when the
 * same file needs a context-specific description on a single block.
 *
 * @example
 * // Named alt — resolved automatically per locale
 * { fileId: 12, altKey: 'hero', altOverride: null }
 *
 * // Inline override — ignores file_alts
 * { fileId: 12, altKey: null, altOverride: 'Custom description for this block' }
 */
export interface FileRef {
	fileId: number;
	altKey: string | null;
	altOverride?: string | null;
}

/**
 * Coarse file category derived from the MIME type. Used by render helpers
 * (e.g. `<FileImage>`) and by manual front pages to decide how to render a
 * resolved file — images via the component, everything else directly from
 * the same prop (e.g. a download link).
 */
export type FileType = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'other';

/**
 * The display intent declared at resolution time (user story 2). Locale is
 * always resolved to a concrete value by the caller; `altKey` and
 * `altOverride` are optional.
 */
export interface FileDisplayIntent {
	locale: string;
	altKey: string | null;
	altOverride: string | null;
}

/**
 * A fully resolved file object passed to the page renderer.
 * All async lookups (URL generation, alt resolution, responsive variants) are
 * performed server-side so React components receive plain data with no further
 * DB or storage calls.
 */
export interface ResolvedFile {
	id: number;
	url: string;
	filename: string;
	mimeType: string;
	extension: string;
	size: number;
	type: FileType;
	alt: string;
	width?: number;
	height?: number;
	variants?: Record<number, string>;
}
