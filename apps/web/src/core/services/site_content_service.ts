import fs from 'node:fs/promises';
import path from 'node:path';
import { inject } from '@adonisjs/core';
import app from '@adonisjs/core/services/app';
import { parseMarkdownFrontmatter } from '#core/services/markdown_frontmatter';
import { parseProjectBlocks } from '#core/services/project_blocks';
import type { HomeContent, SiteProject, SiteService } from '#types/site_content';

/**
 * Resolves the hand-written site content (services and projects) from the
 * committed markdown sources in `content/`.
 *
 * A read-only catalogue over the filesystem — a deliberate direct-infra-access
 * exception to the service→repository layering. The front has no content
 * persistence by design: each service and project lives as a markdown file in
 * the repo, and this service parses that source into the JSON payload the
 * front pages consume. Files are ordered by their `order` frontmatter field.
 */
@inject()
export class SiteContentService {
	/**
	 * Resolve every service and the first three projects for the home page.
	 *
	 * @returns The service catalogue and the newest three projects, parsed
	 * from the committed markdown sources.
	 */
	async getHomeContent(): Promise<HomeContent> {
		const [services, projects] = await Promise.all([this.readServices(), this.readProjects()]);

		return { services, projects: projects.slice(0, HOME_PROJECT_LIMIT) };
	}

	/**
	 * Resolve the service catalogue for the services page.
	 *
	 * @returns The ordered service offers, parsed from the committed markdown
	 * sources in `content/services/`.
	 */
	async getServices(): Promise<SiteService[]> {
		return this.readServices();
	}

	/**
	 * Resolve the project catalogue for the projects page.
	 *
	 * @returns The ordered project portfolio, parsed from the committed markdown
	 * sources in `content/projects/`.
	 */
	async getProjects(): Promise<SiteProject[]> {
		return this.readProjects();
	}

	/**
	 * Resolve a single project by its content slug (the source filename without
	 * the `.md` extension, e.g. `'adonisjs-foundry'`).
	 *
	 * The slug is read straight from `content/projects/{slug}.md`, so each
	 * project single page is driven by its own committed source file.
	 *
	 * @param slug - Project slug matching `content/projects/{slug}.md`.
	 * @returns The parsed project entry.
	 * @throws {Error} With code `E_PROJECT_NOT_FOUND` and status `404` when no
	 * source file matches the slug.
	 */
	async getProjectBySlug(slug: string): Promise<SiteProject> {
		if (!SAFE_SLUG_RE.test(slug)) throw projectNotFound(slug);

		const dir = path.join(app.makePath('content'), 'projects');
		const source = await fs.readFile(path.join(dir, `${slug}.md`), 'utf-8').catch(() => {
			throw projectNotFound(slug);
		});

		try {
			const { attributes, body } = parseMarkdownFrontmatter(source);
			return this.parseProject(attributes, body, slug);
		} catch (error) {
			throw augmentContentError(error, `content/projects/${slug}.md`);
		}
	}

	/**
	 * Read and parse every markdown file in `content/services/`, ordered by the
	 * `order` frontmatter field (unchanged files sort last, stable). The trailing
	 * `**Inclus**` / `**Tarif**` fact lines are lifted out of the body.
	 *
	 * @returns The service catalogue.
	 */
	private async readServices(): Promise<SiteService[]> {
		return this.readCollection(
			'services',
			(attributes, body) => {
				const { description, inclus, tarif } = splitServiceBody(body);

				return {
					rubrique: requiredString(attributes, 'rubrique'),
					items: requiredStringArray(attributes, 'items'),
					description,
					inclus,
					tarif,
				};
			},
			'asc',
		);
	}

	/**
	 * Read and parse every markdown file in `content/projects/`, ordered by the
	 * `order` frontmatter field descending — newest content is the highest `order`
	 * and leads the portfolio, so adding a project is just appending a higher
	 * number. Un-ordered files sort last, stable.
	 *
	 * @returns The project catalogue.
	 */
	private async readProjects(): Promise<SiteProject[]> {
		return this.readCollection(
			'projects',
			(attributes, body, slug) => this.parseProject(attributes, body, slug),
			'desc',
		);
	}

	/**
	 * Map parsed project frontmatter and body onto a `SiteProject`.
	 *
	 * @param attributes - Parsed frontmatter attributes.
	 * @param body - The raw markdown body.
	 * @param slug - Content slug matching `content/projects/{slug}.md`.
	 * @returns The parsed project entry.
	 * @throws {Error} With code `E_INVALID_CONTENT` when a required field is
	 * missing.
	 */
	private parseProject(attributes: Record<string, unknown>, body: string, slug: string): SiteProject {
		return {
			slug,
			cover: requiredFileId(attributes, 'cover'),
			rubrique: requiredString(attributes, 'rubrique'),
			title: requiredString(attributes, 'title'),
			note: requiredString(attributes, 'note'),
			metaTitle: optionalString(attributes, 'metaTitle'),
			metaDescription: optionalString(attributes, 'metaDescription'),
			blocks: parseProjectBlocks(body),
		};
	}

	/**
	 * Read, parse, validate, and order one content folder.
	 *
	 * @param folder - Content folder name, relative to `content/`.
	 * @param parse - Maps parsed frontmatter attributes and body to a content item.
	 * @param direction - Sort direction for the `order` frontmatter field:
	 * `'asc'` for services (catalog order), `'desc'` for projects (newest first).
	 * @returns The parsed collection ordered by the `order` frontmatter field.
	 * @throws {Error} With code `E_INVALID_CONTENT` when a source file is missing
	 * a required frontmatter field.
	 */
	private async readCollection<T>(
		folder: 'services' | 'projects',
		parse: (attributes: Record<string, unknown>, body: string, slug: string) => T,
		direction: 'asc' | 'desc',
	): Promise<T[]> {
		const dir = path.join(app.makePath('content'), folder);
		const entries = await fs.readdir(dir);
		const markdownEntries = entries.filter((entry) => entry.endsWith('.md'));

		const items = await Promise.all(
			markdownEntries.map(async (entry) => {
				const source = await fs.readFile(path.join(dir, entry), 'utf-8');
				try {
					const { attributes, body } = parseMarkdownFrontmatter(source);
					const slug = entry.replace(/\.md$/, '');
					return { item: parse(attributes, body, slug), order: orderOf(attributes) };
				} catch (error) {
					throw augmentContentError(error, `content/${folder}/${entry}`);
				}
			}),
		);

		const sign = direction === 'desc' ? -1 : 1;
		return items.sort((a, b) => sign * (a.order - b.order)).map(({ item }) => item);
	}
}

/**
 * Resolve the display order of a content item from its frontmatter, defaulting
 * un-ordered sources to the end of the collection.
 *
 * @param attributes - Parsed frontmatter attributes.
 */
function orderOf(attributes: Record<string, unknown>): number {
	const order = attributes.order;
	return typeof order === 'number' ? order : Number.MAX_SAFE_INTEGER;
}

/**
 * Split a service markdown body into its descriptive core and the trailing
 * `**Inclus**` / `**Tarif**` fact lines.
 *
 * @param body - The raw markdown body of one service source.
 * @returns The description without the fact lines, plus the extracted
 * `inclus` and `tarif` values when present.
 */
function splitServiceBody(body: string): { description: string; inclus?: string; tarif?: string } {
	const lines = body.split(/\r?\n/);
	const kept: string[] = [];
	let inclus: string | undefined;
	let tarif: string | undefined;

	for (const line of lines) {
		const inclusMatch = /^\*\*Inclus\*\*\s*:?\s*(.+)$/.exec(line);
		const tarifMatch = /^\*\*Tarif\*\*\s*:?\s*(.+)$/.exec(line);

		if (inclusMatch) {
			inclus = inclusMatch[1].trim();
		} else if (tarifMatch) {
			tarif = tarifMatch[1].trim();
		} else {
			kept.push(line);
		}
	}

	return { description: kept.join('\n').trim(), inclus, tarif };
}

/**
 * Read a required string frontmatter field.
 *
 * @param attributes - Parsed frontmatter attributes.
 * @param key - The field to read.
 * @throws {Error} With code `E_INVALID_CONTENT` when the field is missing or
 * not a non-empty string.
 */
function requiredString(attributes: Record<string, unknown>, key: string): string {
	const value = attributes[key];
	if (typeof value !== 'string' || value.trim() === '') {
		throw contentError(`Missing or invalid "${key}" field`);
	}
	return value;
}

/**
 * Read an optional string frontmatter field.
 *
 * Unlike the required readers, an absent, blank, or non-string value yields
 * `undefined` instead of an error — the page head falls back to its base
 * title/note for such sources.
 *
 * @param attributes - Parsed frontmatter attributes.
 * @param key - The field to read.
 */
function optionalString(attributes: Record<string, unknown>, key: string): string | undefined {
	const value = attributes[key];
	if (typeof value !== 'string' || value.trim() === '') {
		return undefined;
	}
	return value;
}

/**
 * Read a required positive-integer frontmatter field (used for backend file ids).
 *
 * @param attributes - Parsed frontmatter attributes.
 * @param key - The field to read.
 * @throws {Error} With code `E_INVALID_CONTENT` when the field is missing or
 * not a positive integer.
 */
function requiredFileId(attributes: Record<string, unknown>, key: string): number {
	const value = attributes[key];
	if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
		throw contentError(`Missing or invalid "${key}" field`);
	}
	return value;
}

/**
 * Read a required string-array frontmatter field.
 *
 * @param attributes - Parsed frontmatter attributes.
 * @param key - The field to read.
 * @throws {Error} With code `E_INVALID_CONTENT` when the field is missing or
 * contains a non-string entry.
 */
function requiredStringArray(attributes: Record<string, unknown>, key: string): string[] {
	const value = attributes[key];
	if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
		throw contentError(`Missing or invalid "${key}" field`);
	}
	return value;
}

/**
 * Build a content validation error tagged with `E_INVALID_CONTENT`.
 *
 * @param message - Human-readable detail.
 */
function contentError(message: string): Error {
	return Object.assign(new Error(`Invalid site content: ${message}`), { code: 'E_INVALID_CONTENT' });
}

/**
 * Attach the offending source file to a content error.
 *
 * @param error - The original error.
 * @param label - Source file path relative to the app root.
 */
function augmentContentError(error: unknown, label: string): Error {
	const message = error instanceof Error ? error.message : String(error);
	const code = error instanceof Error && 'code' in error ? error.code : undefined;
	return Object.assign(new Error(`${message} (in ${label})`), { code });
}

/**
 * A safe content slug: lowercase alphanumerics and hyphens only, so a slug can
 * never escape `content/projects/` or target an arbitrary file.
 */
const SAFE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * How many of the newest projects the home page preview shows. The full
 * portfolio stays available on the projects page.
 */
const HOME_PROJECT_LIMIT = 3;

/**
 * Build the not-found error for a project slug, tagged `E_PROJECT_NOT_FOUND`
 * with an HTTP 404 status.
 *
 * @param slug - The requested project slug.
 */
function projectNotFound(slug: string): Error {
	return Object.assign(new Error(`Project "${slug}" not found in content/projects/`), {
		code: 'E_PROJECT_NOT_FOUND',
		status: 404,
	});
}
