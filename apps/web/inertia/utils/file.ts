import { Data } from '@generated/data';

/**
 * Resolves a single file by id through the admin files API.
 *
 * Serves as the `loadFile` query function injected into the design system's
 * `ImagePicker` — the design system owns no API endpoint of its own.
 */
export async function loadFileById(id: number): Promise<Data.File.File | null> {
	const res = await fetch(`/api/v1/admin/files/${id}`, {
		method: 'GET',
		headers: { Accept: 'application/json' },
	});

	if (!res.ok) return null;

	const data = await res.json();
	return data.data ?? null;
}

/**
 * Formats a byte count as a compact human-readable size.
 *
 * @param bytes - The file size in bytes.
 * @returns The size in `B` for values below 1024 bytes, otherwise the value
 *   divided by 1024 (or 1024²) and labelled `KB` or `MB` with one decimal.
 *
 * @example
 * humanSize(2048) // => '2.0 KB'
 */
export function humanSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Checks whether a MIME type denotes an image file.
 *
 * @param mimeType - The MIME type to inspect (e.g. `'image/png'`).
 * @returns `true` when the type belongs to the `image/` family.
 *
 * @example
 * isImage('image/svg+xml') // => true
 */
export function isImage(mimeType: string): boolean {
	return mimeType.startsWith('image/');
}
