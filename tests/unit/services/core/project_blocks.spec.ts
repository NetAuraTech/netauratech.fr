import { test } from '@japa/runner'
import { parseProjectBlocks } from '#services/core/project_blocks'

/**
 * Unit tests for `parseProjectBlocks`.
 *
 * The parser turns a project markdown body into ordered, typed story blocks:
 * freeform markdown maps to a `lede` then `##` chapters, and `:::type` fences
 * insert typed blocks (`features`, `quote`, `gallery`, `metrics`) in flow order.
 */
test.group('parseProjectBlocks', () => {
  test('maps freeform markdown into a lede followed by chapters', ({ assert }) => {
    const blocks = parseProjectBlocks(
      [
        'Un projet qui commence par une intro.',
        '',
        '## Premier chapitre',
        'Du corps de texte.',
        '',
        '## Second chapitre',
        'Encore du texte.',
      ].join('\n')
    )

    assert.deepEqual(
      blocks.map((block) => block.type),
      ['lede', 'chapter', 'chapter']
    )
    assert.equal(
      blocks[0].type === 'lede' && blocks[0].body,
      'Un projet qui commence par une intro.'
    )
    assert.equal(blocks[1].type === 'chapter' && blocks[1].title, 'Premier chapitre')
  })

  test('interleaves fenced typed blocks with the default markdown', ({ assert }) => {
    const blocks = parseProjectBlocks(
      [
        'Intro du projet.',
        '',
        ':::metrics',
        'AdonisJS v7 · React',
        'Licence MIT',
        ':::',
        '',
        '## Un chapitre',
        'Corps du chapitre.',
        '',
        ':::quote',
        'Une citation marquante.',
        '',
        '--- AdonisJS Foundry',
        ':::',
      ].join('\n')
    )

    assert.deepEqual(
      blocks.map((block) => block.type),
      ['lede', 'metrics', 'chapter', 'quote']
    )
    assert.deepEqual(blocks[1].type === 'metrics' ? blocks[1].items : [], [
      'AdonisJS v7 · React',
      'Licence MIT',
    ])
    assert.deepEqual(blocks[3].type === 'quote' ? [blocks[3].quote, blocks[3].attribution] : [], [
      'Une citation marquante.',
      'AdonisJS Foundry',
    ])
  })

  test('parses features into bold-led items and gallery into file refs', ({ assert }) => {
    const blocks = parseProjectBlocks(
      [
        ':::features',
        '**Solidité.** Une base solide.',
        '',
        '**Liberté.** Une stack standard.',
        ':::',
        '',
        ':::gallery',
        'id:5 | La première image',
        'id:6',
        ':::',
      ].join('\n')
    )

    assert.equal(blocks[0].type, 'features')
    if (blocks[0].type === 'features') {
      assert.deepEqual(
        blocks[0].items.map((item) => item.label),
        ['Solidité', 'Liberté']
      )
      assert.equal(blocks[0].items[0].body, 'Une base solide.')
    }

    assert.equal(blocks[1].type, 'gallery')
    if (blocks[1].type === 'gallery') {
      assert.deepEqual(blocks[1].images, [{ fileId: 5, alt: 'La première image' }, { fileId: 6 }])
    }
  })

  test('drops gallery lines that are not file references', ({ assert }) => {
    const blocks = parseProjectBlocks(
      [':::gallery', "id:12 | Le panneau d'administration", 'id:7', 'seed-one', ':::'].join('\n')
    )

    assert.deepEqual(
      blocks.map((block) => block.type),
      ['gallery']
    )
    assert.equal(blocks[0].type, 'gallery')
    if (blocks[0].type === 'gallery') {
      assert.deepEqual(blocks[0].images, [
        { fileId: 12, alt: "Le panneau d'administration" },
        { fileId: 7 },
      ])
    }
  })

  test('drops unknown fence types and empty content', ({ assert }) => {
    const blocks = parseProjectBlocks(
      [
        ':::inconnu',
        'Contenu ignoré.',
        ':::',
        '',
        ':::metrics',
        ':::',
        '',
        '## Un chapitre',
        'Texte.',
      ].join('\n')
    )

    assert.deepEqual(
      blocks.map((block) => block.type),
      ['chapter']
    )
  })
})
