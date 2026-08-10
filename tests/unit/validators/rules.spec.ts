import vine from '@vinejs/vine'
import { test } from '@japa/runner'
import { email, password } from '#validators/rules'

test.group('Rules - Email', () => {
  test('email rule accepts valid emails', async ({ assert }) => {
    const validator = vine.create({ value: email() })

    const result = await validator.validate({ value: 'user@example.com' })
    assert.equal(result.value, 'user@example.com')
  })

  test('email rule trims and lowercases', async ({ assert }) => {
    const validator = vine.create({ value: email() })

    const result = await validator.validate({ value: '  User@Example.COM  ' })
    assert.equal(result.value, 'user@example.com')
  })

  test('email rule rejects invalid email formats', async ({ assert }) => {
    const validator = vine.create({ value: email() })

    await assert.rejects(() => validator.validate({ value: 'not-an-email' }))
    await assert.rejects(() => validator.validate({ value: 'missing@domain' }))
    await assert.rejects(() => validator.validate({ value: '@no-local.com' }))
  })

  test('email rule rejects strings longer than 254 characters', async ({ assert }) => {
    const validator = vine.create({ value: email() })

    // Valid length (under 254)
    const result = await validator.validate({ value: 'short@example.com' })
    assert.equal(result.value, 'short@example.com')

    // Over 254 characters
    const wayOver = { value: 'a'.repeat(260) + '@example.com' } // 271 chars
    await assert.rejects(() => validator.validate(wayOver))
  })
})

test.group('Rules - Password', () => {
  test('password rule accepts passwords between 8 and 32 characters', async ({ assert }) => {
    const validator = vine.create({ value: password() })

    // Exactly 8 chars (min)
    let result = await validator.validate({ value: '12345678' })
    assert.equal(result.value, '12345678')

    // Exactly 32 chars (max)
    result = await validator.validate({ value: 'a'.repeat(32) })
    assert.equal(result.value, 'a'.repeat(32))

    // 20 chars (middle ground)
    result = await validator.validate({ value: 'password123456789ab' })
    assert.equal(result.value, 'password123456789ab')
  })

  test('password rule rejects strings shorter than 8 characters', async ({ assert }) => {
    const validator = vine.create({ value: password() })

    await assert.rejects(() => validator.validate({ value: 'short' }))
    await assert.rejects(() => validator.validate({ value: '1234567' })) // 7 chars
  })

  test('password rule rejects strings longer than 32 characters', async ({ assert }) => {
    const validator = vine.create({ value: password() })

    await assert.rejects(() => validator.validate({ value: 'a'.repeat(33) }))
  })
})
