import type { FileType } from '#types/file';

/**
 * Classifies a MIME type into a coarse `FileType`.
 *
 * Used by the `FileTransformer` and the page resolver so manual fronts and CMS
 * pages agree on how a resolved file should be rendered (image component vs.
 * download link).
 *
 * @param mimeType - The file's MIME type (e.g. `image/jpeg`)
 * @returns The coarse {@link FileType} category
 *
 * @example
 * classifyFileType('image/jpeg') // → 'image'
 * classifyFileType('application/pdf') // → 'pdf'
 */
export function classifyFileType(mimeType: string): FileType {
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	if (mimeType.startsWith('audio/')) return 'audio';
	if (mimeType === 'application/pdf') return 'pdf';

	const isDocument = [
		'text/',
		'application/msword',
		'application/vnd.openxmlformats-officedocument',
		'application/vnd.ms-',
	].some((prefix) => mimeType.startsWith(prefix));

	return isDocument ? 'document' : 'other';
}
