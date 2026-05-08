import { test } from '@japa/runner'
import { builderOperationValidator, builderPresenceValidator } from '#validators/builder'

/**
 * Unit tests for builder validators.
 * No database required — pure schema validation.
 */
test.group('builderOperationValidator', () => {
  const base = { pageId: 1, translationId: 2, op: 'UPDATE_PROPS' }

  // ─── Envelope ─────────────────────────────────────────────────────────────

  test('accepts a valid UPDATE_PROPS payload', async ({ assert }) => {
    const result = await builderOperationValidator.validate({
      ...base,
      blockId: 'block-1',
      props: { title: 'New title' },
    })
    assert.equal(result.op, 'UPDATE_PROPS')
    assert.equal(result.pageId, 1)
    assert.equal(result.translationId, 2)
  })

  test('rejects missing pageId', async ({ assert }) => {
    await assert.rejects(() =>
      builderOperationValidator.validate({ translationId: 2, op: 'CURSOR' })
    )
  })

  test('rejects non-positive pageId', async ({ assert }) => {
    await assert.rejects(() => builderOperationValidator.validate({ ...base, pageId: 0 }))
  })

  test('rejects missing translationId', async ({ assert }) => {
    await assert.rejects(() => builderOperationValidator.validate({ pageId: 1, op: 'CURSOR' }))
  })

  test('rejects missing op', async ({ assert }) => {
    await assert.rejects(() => builderOperationValidator.validate({ pageId: 1, translationId: 2 }))
  })

  test('rejects unknown op type', async ({ assert }) => {
    await assert.rejects(() => builderOperationValidator.validate({ ...base, op: 'UNKNOWN_OP' }))
  })

  // ─── All valid op types ────────────────────────────────────────────────────

  const OPS = [
    'UPDATE_PROPS',
    'MOVE_BLOCK',
    'ADD_BLOCK',
    'DELETE_BLOCK',
    'CURSOR',
    'LOCK_ACQUIRE',
    'LOCK_RELEASE',
  ]

  for (const op of OPS) {
    test(`accepts op type: ${op}`, async ({ assert }) => {
      const result = await builderOperationValidator.validate({ pageId: 1, translationId: 1, op })
      assert.equal(result.op, op)
    })
  }

  // ─── Op-specific fields ───────────────────────────────────────────────────

  test('accepts MOVE_BLOCK with all required fields', async ({ assert }) => {
    const result = await builderOperationValidator.validate({
      pageId: 1,
      translationId: 1,
      op: 'MOVE_BLOCK',
      blockId: 'block-1',
      newParentId: 'root',
      newIndex: 0,
    })
    assert.equal(result.op, 'MOVE_BLOCK')
    assert.equal(result.newParentId, 'root')
    assert.equal(result.newIndex, 0)
  })

  test('rejects negative newIndex', async ({ assert }) => {
    await assert.rejects(() =>
      builderOperationValidator.validate({
        pageId: 1,
        translationId: 1,
        op: 'MOVE_BLOCK',
        blockId: 'b1',
        newParentId: 'root',
        newIndex: -1,
      })
    )
  })

  test('accepts LOCK_ACQUIRE with blockId and fieldKey', async ({ assert }) => {
    const result = await builderOperationValidator.validate({
      pageId: 1,
      translationId: 1,
      op: 'LOCK_ACQUIRE',
      blockId: 'block-1',
      fieldKey: 'title',
    })
    assert.equal(result.fieldKey, 'title')
  })

  test('rejects fieldKey longer than 100 characters', async ({ assert }) => {
    await assert.rejects(() =>
      builderOperationValidator.validate({
        pageId: 1,
        translationId: 1,
        op: 'LOCK_ACQUIRE',
        blockId: 'b1',
        fieldKey: 'k'.repeat(101),
      })
    )
  })

  test('accepts CURSOR with null blockId', async ({ assert }) => {
    const result = await builderOperationValidator.validate({
      pageId: 1,
      translationId: 1,
      op: 'CURSOR',
      blockId: undefined,
    })
    assert.equal(result.op, 'CURSOR')
  })

  test('trims blockId and fieldKey whitespace', async ({ assert }) => {
    const result = await builderOperationValidator.validate({
      pageId: 1,
      translationId: 1,
      op: 'LOCK_ACQUIRE',
      blockId: '  block-1  ',
      fieldKey: '  title  ',
    })
    assert.equal(result.blockId, 'block-1')
    assert.equal(result.fieldKey, 'title')
  })
})

test.group('builderPresenceValidator', () => {
  test('accepts valid translationId', async ({ assert }) => {
    const result = await builderPresenceValidator.validate({ translationId: 5 })
    assert.equal(result.translationId, 5)
  })

  test('rejects missing translationId', async ({ assert }) => {
    await assert.rejects(() => builderPresenceValidator.validate({}))
  })

  test('rejects non-positive translationId', async ({ assert }) => {
    await assert.rejects(() => builderPresenceValidator.validate({ translationId: 0 }))
    await assert.rejects(() => builderPresenceValidator.validate({ translationId: -1 }))
  })
})
