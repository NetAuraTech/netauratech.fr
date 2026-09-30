import type { ProjectBlock, ProjectFeature, ProjectGalleryFileRef } from '#types/site_content';

/**
 * Fenced block types accepted in a project source body. Freeform markdown
 * outside fences maps to `lede` / `chapter` blocks; a fence `:::type` … `:::`
 * inserts one of these typed blocks in flow order.
 */
type TypedBlockType = 'lede' | 'features' | 'quote' | 'gallery' | 'metrics';

const OPEN_FENCE_RE = /^:::(\w+)\s*$/;
const CLOSE_FENCE_RE = /^:::\s*$/;

/** A gallery line pointing at a backend file, e.g. `id:12`. */
const FILE_ID_REF_RE = /^id:(\d+)$/i;

/**
 * Parse a project source body into ordered story blocks.
 *
 * The body stays authored as markdown in `content/projects/{slug}.md`. Lines
 * outside a fence are flushed, in order, as the default mapping: the text
 * before the first `##` heading becomes a `lede` block, and every `##` heading
 * opens a `chapter` block (title + body). A fenced region — a line `:::type`
 * closed by a line `:::` — inserts a typed block (`features`, `quote`,
 * `gallery`, `metrics`, or an explicit `lede`) at its position in the flow, so
 * each kind can render with its own layout.
 *
 * Unknown fence types are dropped silently so authors can iterate on the format
 * without crashing the front.
 *
 * @param body - The raw markdown body of a project source.
 * @returns The ordered story blocks.
 */
export function parseProjectBlocks(body: string): ProjectBlock[] {
	const lines = body.split(/\r?\n/);
	const blocks: ProjectBlock[] = [];
	let markdown: string[] = [];

	const flushMarkdown = () => {
		if (markdown.length === 0) return;
		if (!markdown.some((line) => line.trim())) {
			markdown = [];
			return;
		}
		blocks.push(...splitIntoDefaults(markdown.join('\n')));
		markdown = [];
	};

	let i = 0;
	while (i < lines.length) {
		const open = OPEN_FENCE_RE.exec(lines[i]);
		if (open) {
			flushMarkdown();
			const type = open[1].toLowerCase() as TypedBlockType;
			const inner: string[] = [];
			i++;
			while (i < lines.length && !CLOSE_FENCE_RE.test(lines[i])) {
				inner.push(lines[i]);
				i++;
			}
			// Skip the closing fence (if present).
			if (i < lines.length) i++;

			const block = parseTypedBlock(type, inner.join('\n'));
			if (block) blocks.push(block);
			continue;
		}
		markdown.push(lines[i]);
		i++;
	}
	flushMarkdown();

	return blocks;
}

/**
 * Split freeform markdown into the default `lede` + `chapter` blocks.
 *
 * The text before the first `##` heading is the lede; every `##` heading opens
 * a chapter carrying its title and the body that follows it.
 */
function splitIntoDefaults(md: string): ProjectBlock[] {
	const blocks: ProjectBlock[] = [];
	const text = md.trim();
	if (!text) return blocks;

	const parts = text.split(/^##\s+/m);
	const lede = (parts.shift() ?? '').trim();
	if (lede) blocks.push({ type: 'lede', body: lede });

	for (const part of parts) {
		const [first, ...rest] = part.split(/\r?\n/);
		blocks.push({ type: 'chapter', title: first.trim(), body: rest.join('\n').trim() });
	}

	return blocks;
}

/**
 * Parse the inner text of a fenced block into a typed block, or `null` when the
 * type is unknown or the block carries no content.
 */
function parseTypedBlock(type: TypedBlockType, inner: string): ProjectBlock | null {
	switch (type) {
		case 'lede': {
			const body = inner.trim();
			return body ? { type: 'lede', body } : null;
		}
		case 'features': {
			const items = parseFeatures(inner);
			return items.length > 0 ? { type: 'features', items } : null;
		}
		case 'quote': {
			const parsed = parseQuote(inner);
			return parsed ? { type: 'quote', ...parsed } : null;
		}
		case 'gallery': {
			const images = parseGallery(inner);
			return images.length > 0 ? { type: 'gallery', images } : null;
		}
		case 'metrics': {
			const items = parseMetrics(inner);
			return items.length > 0 ? { type: 'metrics', items } : null;
		}
		default:
			return null;
	}
}

/**
 * Parse `features` paragraphs into bold-led feature blurbs.
 *
 * Each blank-line-separated paragraph is expected to start with `**Label.**`;
 * the leading label is lifted out (so the renderer can show it as a kicker) and
 * the remaining markdown is kept as the body. Paragraphs without a bold lead
 * become an empty-label feature.
 */
function parseFeatures(inner: string): ProjectFeature[] {
	return inner
		.split(/\n\s*\n/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean)
		.map((paragraph) => {
			const match = /^\*\*([^*]+?)\.?\*\*\s*([\s\S]*)/.exec(paragraph);
			if (!match) return { label: '', body: paragraph };
			return { label: match[1].replace(/\.$/, '').trim(), body: match[2].trim() };
		});
}

/**
 * Parse a `quote` block: the first paragraph is the quote, an optional second
 * paragraph (often a `---` line or starting with `—`) is the attribution.
 */
function parseQuote(inner: string): { quote: string; attribution?: string } | null {
	const [rawQuote, rawAttribution] = inner.split(/\n\s*\n/).map((part) => part.trim());
	if (!rawQuote) return null;
	const quote = collapseWhitespace(rawQuote);
	if (!rawAttribution) return { quote };
	const attribution = collapseWhitespace(rawAttribution.replace(/^[—–-]+\s*/, ''));
	return attribution ? { quote, attribution } : { quote };
}

/**
 * Parse a `gallery` block into backend file references: one image per line, an
 * `id:N` reference with an optional `| alt text` suffix. Lines that are not a
 * file reference are dropped silently, matching how unknown fence types and
 * empty blocks are handled.
 */
function parseGallery(inner: string): ProjectGalleryFileRef[] {
	return inner
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line): ProjectGalleryFileRef | null => {
			const [ref, ...altParts] = line.split('|');
			const value = ref.trim();
			const alt = altParts.join('|').trim();

			const fileIdMatch = FILE_ID_REF_RE.exec(value);
			if (!fileIdMatch) {
				return null;
			}
			const fileId = Number(fileIdMatch[1]);
			if (fileId <= 0) {
				return null;
			}
			return alt ? { fileId, alt } : { fileId };
		})
		.filter((image): image is ProjectGalleryFileRef => image !== null);
}

/**
 * Parse a `metrics` block: one figure per non-empty line.
 */
function parseMetrics(inner: string): string[] {
	return inner
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
}

/** Collapse runs of whitespace (including newlines) into single spaces. */
function collapseWhitespace(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}
