import { parseDocument } from 'yaml';

/**
 * The parsed result of a markdown source: the YAML frontmatter as plain
 * attributes plus the remaining markdown body.
 */
export type ParsedMarkdown = {
	attributes: Record<string, unknown>;
	/** Markdown body after the frontmatter block, trimmed. */
	body: string;
};

/**
 * Matches a leading YAML frontmatter block delimited by `---` lines.
 */
const FRONTMATTER_RE = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;

/**
 * Parse a markdown source into its YAML frontmatter attributes and body.
 *
 * Sources without a leading frontmatter block yield empty attributes and the
 * whole source as the body. The frontmatter is parsed with the `yaml` package,
 * so dashed lists, quoted strings, and numbers convert to real JS values.
 *
 * @param source - Raw markdown content.
 * @returns The frontmatter attributes and the markdown body.
 *
 * @example
 * const { attributes, body } = parseMarkdownFrontmatter('---\nrubrique: Sites vitrines\nitems:\n  - Design\n---\n\nDescription')
 */
export function parseMarkdownFrontmatter(source: string): ParsedMarkdown {
	const match = FRONTMATTER_RE.exec(source);
	if (!match) {
		return { attributes: {}, body: source.trim() };
	}

	const document = parseDocument(match[1]);
	const value = document.toJS();
	const attributes = isRecord(value) ? value : {};

	return { attributes, body: source.slice(match[0].length).trim() };
}

/**
 * Narrow a parsed YAML value to a plain record.
 *
 * @param value - The value returned by the YAML document.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
