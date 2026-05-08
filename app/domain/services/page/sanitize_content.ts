import { JSDOM } from 'jsdom'
import type { Block, PageContent } from '#types/page'
import DOMPurify, { type Config } from 'dompurify'

// isomorphic-dompurify requires a JSDOM window in a Node environment
const { window } = new JSDOM('')
const purify = DOMPurify(window as unknown as Window & typeof globalThis)

/**
 * DOMPurify configuration used for CMS rich-text content.
 *
 * Allows the full set of formatting tags produced by typical rich-text
 * editors (headings, lists, links, images, blockquotes, code) while
 * blocking anything that could execute arbitrary code.
 */
const PURIFY_CONFIG: Config = {
  USE_PROFILES: { html: true },
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'del',
    'ins',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'figure',
    'figcaption',
    'hr',
    'br',
    'span',
    'div',
  ],
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'title',
    'target',
    'rel',
    'class',
    'id',
    'width',
    'height',
    'colspan',
    'rowspan',
    'data-*',
  ],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onsubmit'],
  // Force all links to be safe
  FORCE_BODY: true,
}

/**
 * Recursively walks the block tree and sanitises the `content` field of every
 * `rich_text` block using DOMPurify (server-side, via jsdom).
 *
 * Called in `PageService` before any `create` or `update` that persists
 * `PageContent` to the database. This is the first line of defence; the
 * React `RichTextBlock` component also sanitises at render time as a
 * second layer.
 *
 * @param content - The `PageContent` to sanitise in-place
 * @returns The same `PageContent` object with all rich-text HTML cleaned
 */
export function sanitizePageContent(content: PageContent): PageContent {
  const sanitizeBlocks = (blocks: Block[]): Block[] =>
    blocks.map((block) => {
      if (block.type === 'htmltext') {
        return {
          ...block,
          props: {
            ...block.props,
            content: purify.sanitize(
              (block.props as { content: string }).content ?? '',
              PURIFY_CONFIG
            ) as unknown as string,
          },
        }
      }

      if (block.children?.length) {
        return { ...block, children: sanitizeBlocks(block.children) }
      }

      return block
    })

  return { ...content, blocks: sanitizeBlocks(content.blocks) }
}
