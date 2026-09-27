import { test } from '@japa/runner'
import { parseMarkdownFrontmatter } from '#helpers/core/markdown_frontmatter'

/**
 * Unit tests for the markdown frontmatter parser.
 */
test.group('parseMarkdownFrontmatter', () => {
  test('parses a frontmatter block into attributes and body', ({ assert }) => {
    const source = [
      '---',
      'rubrique: Sites vitrines',
      'items:',
      '  - Design sur mesure',
      '  - SEO & performance',
      '---',
      '',
      'Un site vitrine écrit à la main.',
    ].join('\n')

    const parsed = parseMarkdownFrontmatter(source)

    assert.deepEqual(parsed.attributes, {
      rubrique: 'Sites vitrines',
      items: ['Design sur mesure', 'SEO & performance'],
    })
    assert.equal(parsed.body, 'Un site vitrine écrit à la main.')
  })

  test('converts number attributes to numbers', ({ assert }) => {
    const source = '---\norder: 2\nrubrique: Boutiques en ligne\n---\n\nBody'

    const parsed = parseMarkdownFrontmatter(source)

    assert.equal(parsed.attributes.order, 2)
    assert.equal(typeof parsed.attributes.order, 'number')
  })

  test('keeps quoted strings as single values even with a colon inside', ({ assert }) => {
    const source = '---\nnote: "Boutique : en ligne"\n---\n\nBody'

    const parsed = parseMarkdownFrontmatter(source)

    assert.equal(parsed.attributes.note, 'Boutique : en ligne')
  })

  test('returns empty attributes and the whole source as body without frontmatter', ({
    assert,
  }) => {
    const source = '# Title\n\nJust content, no frontmatter.'

    const parsed = parseMarkdownFrontmatter(source)

    assert.deepEqual(parsed.attributes, {})
    assert.equal(parsed.body, source)
  })

  test('returns an empty body when the frontmatter is the whole file', ({ assert }) => {
    const source = '---\nrubrique: Sites vitrines\n---'

    const parsed = parseMarkdownFrontmatter(source)

    assert.deepEqual(parsed.attributes, { rubrique: 'Sites vitrines' })
    assert.equal(parsed.body, '')
  })
})
