import { test } from '@japa/runner'
import { contactValidator } from '#validators/contact'

/**
 * Unit tests for `contactValidator`.
 * No database required — pure schema validation.
 *
 * The validator is a `vine.record()` that accepts a flat dictionary of
 * string values (trimmed, max 2000 chars each).
 */
test.group('Contact validator', () => {
  const validPayload = {
    name: 'John Doe',
    message: 'Hello there!',
  }

  test('accepts a fully valid payload', async ({ assert }) => {
    const result = await contactValidator.validate(validPayload)
    assert.equal(result.name, 'John Doe')
    assert.equal(result.message, 'Hello there!')
  })

  // ─── fields ───────────────────────────────────────────────────────────────
  test('rejects a field value exceeding 2000 characters', async ({ assert }) => {
    await assert.rejects(() =>
      contactValidator.validate({
        ...validPayload,
        message: 'a'.repeat(2001),
      })
    )
  })

  test('trims field value', async ({ assert }) => {
    const result = await contactValidator.validate({
      ...validPayload,
      name: '  John  ',
    })
    assert.equal(result.name, 'John')
  })

  test('accepts multiple fields', async ({ assert }) => {
    const result = await contactValidator.validate({
      ...validPayload,
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hi there!',
    })
    assert.equal(result.name, 'Alice')
    assert.equal(result.email, 'alice@example.com')
    assert.equal(result.message, 'Hi there!')
  })
})
