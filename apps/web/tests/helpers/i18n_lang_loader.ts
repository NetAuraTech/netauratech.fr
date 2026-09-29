import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const LOCALES = ['en', 'fr'] as const;

const LANG_DIR = resolve(process.cwd(), 'resources', 'lang');

/**
 * Recursively flattens a nested lang object into dot-notation keys. The file
 * basename is the root namespace (e.g. `admin.json` → `admin.*`). A JSON key
 * that itself contains dots is appended verbatim, matching the flat key the
 * i18n runtime uses.
 */
function flatten(root: string, obj: Record<string, any>, acc: Record<string, string>, prefix = ''): void {
	for (const [key, value] of Object.entries(obj)) {
		const full = prefix ? `${prefix}.${key}` : key;
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			flatten(root, value, acc, full);
		} else {
			acc[`${root}.${full}`] = String(value);
		}
	}
}

/**
 * Collects every lang file under `dir` as `[namespace, absolutePath]` pairs.
 * Subdirectories become namespace segments (`cms/page.json` → `cms.page`),
 * mirroring the i18n runtime.
 */
function collectLangFiles(dir: string): Array<[string, string]> {
	const out: Array<[string, string]> = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			for (const [ns, file] of collectLangFiles(full)) {
				out.push([entry.name + '.' + ns, file]);
			}
		} else if (entry.name.endsWith('.json')) {
			out.push([entry.name.replace(/\.json$/, ''), full]);
		}
	}
	return out;
}

export function loadLang(locale: string): Record<string, string> {
	const dir = join(LANG_DIR, locale);
	const acc: Record<string, string> = {};
	for (const [root, file] of collectLangFiles(dir)) {
		const parsed = JSON.parse(readFileSync(file, 'utf8'));
		flatten(root, parsed, acc);
	}
	return acc;
}

/**
 * Collects the paths of every leaf in a payload whose value is the empty
 * string. A missing translation key falls back to the key itself, so this
 * specifically guards against keys stored as empty strings in the lang files.
 */
export function emptyLeaves(root: Record<string, any>, prefix = ''): string[] {
	const out: string[] = [];
	for (const [key, value] of Object.entries(root)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			out.push(...emptyLeaves(value, path));
		} else if (value === '') {
			out.push(path);
		}
	}
	return out;
}
