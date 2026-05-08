import { test } from '@japa/runner'
import { sanitizePageContent } from '#services/page/sanitize_content'
import type { PageContent, Block } from '#types/page'

/**
 * Unit tests for `sanitizePageContent`.
 *
 * No mocks needed — this is a pure function operating on plain objects.
 * Tests verify that:
 * - dangerous HTML is stripped from `htmltext` blocks
 * - safe HTML is preserved
 * - non-htmltext blocks are left untouched
 * - the function is non-mutating (returns a new object)
 * - recursion works for nested blocks inside `section` / `grid`
 */
test.group('sanitizePageContent', () => {
  // ─── Helpers ──────────────────────────────────────────────────────────────

  function makeHtmlText(content: string): Block {
    return {
      id: 'ht1',
      type: 'htmltext',
      props: { content, align: 'left' },
    } as Block
  }

  function makeTitle(): Block {
    return {
      id: 'title1',
      type: 'title',
      props: { text: 'Hello', level: 1, align: 'left', color: null },
    } as Block
  }

  function makeSection(children: Block[]): Block {
    return {
      id: 'section1',
      type: 'section',
      props: {
        background: 'canvas',
        paddingY: { default: 'md' },
        paddingX: { default: 'md' },
        maxWidth: 'xl',
        rounded: false,
      },
      children,
    } as Block
  }

  // ─── Non-mutating ─────────────────────────────────────────────────────────

  test('returns a new object — does not mutate the input', ({ assert }) => {
    const content: PageContent = { blocks: [makeTitle()] }
    const result = sanitizePageContent(content)
    assert.notStrictEqual(result, content)
    assert.notStrictEqual(result.blocks, content.blocks)
  })

  // ─── Script injection ─────────────────────────────────────────────────────

  test('strips <script> tags from htmltext content', ({ assert }) => {
    const content: PageContent = {
      blocks: [makeHtmlText('<p>Hello</p><script>alert("xss")</script>')],
    }
    const result = sanitizePageContent(content)
    const props = result.blocks[0].props as { content: string }
    assert.isFalse(props.content.includes('<script>'))
    assert.isFalse(props.content.includes('alert'))
  })

  test('strips inline event handlers (onclick, onerror, onload)', ({ assert }) => {
    const content: PageContent = {
      blocks: [makeHtmlText('<p onclick="evil()">Click me</p><img src="x" onerror="evil()">')],
    }
    const result = sanitizePageContent(content)
    const props = result.blocks[0].props as { content: string }
    assert.isFalse(props.content.includes('onclick'))
    assert.isFalse(props.content.includes('onerror'))
    assert.isFalse(props.content.includes('evil()'))
  })

  test('strips <iframe> tags', ({ assert }) => {
    const content: PageContent = {
      blocks: [makeHtmlText('<p>Text</p><iframe src="https://evil.com"></iframe>')],
    }
    const result = sanitizePageContent(content)
    const props = result.blocks[0].props as { content: string }
    assert.isFalse(props.content.includes('<iframe'))
  })

  test('strips <style> tags', ({ assert }) => {
    const content: PageContent = {
      blocks: [makeHtmlText('<style>body { display: none }</style><p>Hello</p>')],
    }
    const result = sanitizePageContent(content)
    const props = result.blocks[0].props as { content: string }
    assert.isFalse(props.content.includes('<style>'))
  })

  test('strips javascript: href from anchor tags', ({ assert }) => {
    const content: PageContent = {
      blocks: [makeHtmlText('<a href="javascript:alert(1)">Click</a>')],
    }
    const result = sanitizePageContent(content)
    const props = result.blocks[0].props as { content: string }
    assert.isFalse(props.content.includes('javascript:'))
  })

  // ─── Safe HTML preservation ───────────────────────────────────────────────

  test('preserves safe paragraph and formatting tags', ({ assert }) => {
    const html = '<p><strong>Bold</strong> and <em>italic</em> text.</p>'
    const content: PageContent = { blocks: [makeHtmlText(html)] }
    const result = sanitizePageContent(content)
    const props = result.blocks[0].props as { content: string }
    assert.isTrue(props.content.includes('<strong>'))
    assert.isTrue(props.content.includes('<em>'))
    assert.isTrue(props.content.includes('Bold'))
  })

  test('preserves safe anchor tags with href and target', ({ assert }) => {
    const html = '<a href="https://example.com" target="_blank">Link</a>'
    const content: PageContent = { blocks: [makeHtmlText(html)] }
    const result = sanitizePageContent(content)
    const props = result.blocks[0].props as { content: string }
    assert.isTrue(props.content.includes('href="https://example.com"'))
  })

  test('preserves lists (ul, ol, li)', ({ assert }) => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
    const content: PageContent = { blocks: [makeHtmlText(html)] }
    const result = sanitizePageContent(content)
    const props = result.blocks[0].props as { content: string }
    assert.isTrue(props.content.includes('<ul>'))
    assert.isTrue(props.content.includes('<li>'))
  })

  test('preserves headings (h1–h4)', ({ assert }) => {
    const html = '<h2>Section title</h2>'
    const content: PageContent = { blocks: [makeHtmlText(html)] }
    const result = sanitizePageContent(content)
    const props = result.blocks[0].props as { content: string }
    assert.isTrue(props.content.includes('<h2>'))
  })

  test('preserves blockquote and code tags', ({ assert }) => {
    const html = '<blockquote><p>Quote</p></blockquote><pre><code>const x = 1</code></pre>'
    const content: PageContent = { blocks: [makeHtmlText(html)] }
    const result = sanitizePageContent(content)
    const props = result.blocks[0].props as { content: string }
    assert.isTrue(props.content.includes('<blockquote>'))
    assert.isTrue(props.content.includes('<code>'))
  })

  // ─── Non-htmltext blocks left untouched ─────────────────────────────────

  test('does not modify non-htmltext blocks', ({ assert }) => {
    const titleBlock = makeTitle()
    const content: PageContent = { blocks: [titleBlock] }
    const result = sanitizePageContent(content)
    assert.deepEqual(result.blocks[0].props, titleBlock.props)
  })

  test('handles empty blocks array', ({ assert }) => {
    const content: PageContent = { blocks: [] }
    const result = sanitizePageContent(content)
    assert.deepEqual(result.blocks, [])
  })

  // ─── Recursion ────────────────────────────────────────────────────────────

  test('sanitises htmltext blocks nested inside a section', ({ assert }) => {
    const content: PageContent = {
      blocks: [makeSection([makeHtmlText('<p>Safe</p><script>evil()</script>')])],
    }
    const result = sanitizePageContent(content)
    const nested = result.blocks[0].children![0].props as { content: string }
    assert.isFalse(nested.content.includes('<script>'))
    assert.isTrue(nested.content.includes('<p>Safe</p>'))
  })

  test('sanitises deeply nested htmltext blocks', ({ assert }) => {
    const content: PageContent = {
      blocks: [makeSection([makeSection([makeHtmlText('<p>Deep</p><iframe src="x"></iframe>')])])],
    }
    const result = sanitizePageContent(content)
    const deep = result.blocks[0].children![0].children![0].props as { content: string }
    assert.isFalse(deep.content.includes('<iframe'))
    assert.isTrue(deep.content.includes('<p>Deep</p>'))
  })

  // ─── Mixed content ────────────────────────────────────────────────────────

  test('processes multiple htmltext blocks in the same array', ({ assert }) => {
    const content: PageContent = {
      blocks: [
        makeHtmlText('<p>First</p><script>x()</script>'),
        makeTitle(),
        makeHtmlText('<p>Second</p><script>y()</script>'),
      ],
    }
    const result = sanitizePageContent(content)

    const first = result.blocks[0].props as { content: string }
    const second = result.blocks[2].props as { content: string }

    assert.isFalse(first.content.includes('<script>'))
    assert.isFalse(second.content.includes('<script>'))
    assert.isTrue(first.content.includes('First'))
    assert.isTrue(second.content.includes('Second'))
  })
})
