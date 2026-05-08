import { test } from '@japa/runner'
import { ImageOptimizerService } from '#services/file/image_optimizer_service'
import drive from '@adonisjs/drive/services/main'
import sharp from 'sharp'

test.group('ImageOptimizerService', (group) => {
  let service: ImageOptimizerService

  group.each.setup(() => {
    service = new ImageOptimizerService()
  })

  test('returns empty result for non-image files', async ({ assert }) => {
    const file = {
      mimeType: 'application/pdf',
      disk: 'fs',
      path: 'test.pdf',
      filename: 'test.pdf',
    } as any
    const result = await service.optimize(file)
    assert.deepEqual(result, { variants: {} })
  })

  test('returns empty result for SVG images', async ({ assert }) => {
    const file = {
      mimeType: 'image/svg+xml',
      disk: 'fs',
      path: 'test.svg',
      filename: 'test.svg',
    } as any
    const result = await service.optimize(file)
    assert.deepEqual(result, { variants: {} })
  })

  test('returns empty result if original file is missing on disk', async ({ assert }) => {
    drive.fake('s3')
    const file = {
      mimeType: 'image/jpeg',
      disk: 's3',
      path: 'missing.jpg',
      filename: 'missing.jpg',
    } as any
    const result = await service.optimize(file)
    assert.deepEqual(result, { variants: {} })
    drive.restore('s3')
  })

  test('extracts dimensions and generates missing variants', async ({ assert }) => {
    drive.fake('s3')
    const disk = drive.use('s3')

    // Create a 500x500 image
    const originalBuffer = await sharp({
      create: {
        width: 500,
        height: 500,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

    await disk.put('uploads/test.png', originalBuffer)

    const file = {
      mimeType: 'image/png',
      disk: 's3',
      path: 'uploads/test.png',
      filename: 'test.png',
    } as any

    // Request widths: 400 (should generate), 800 (should skip because 800 > 500)
    const result = await service.optimize(file, [400, 800])

    assert.equal(result.width, 500)
    assert.equal(result.height, 500)

    // Variant 400 should exist
    assert.property(result.variants, '400')
    assert.isString(result.variants[400])

    // Variant 800 should NOT exist
    assert.notProperty(result.variants, '800')

    // Verify the variant was actually written to the fake disk
    const variantExists = await disk.exists('uploads/test-400.webp')
    assert.isTrue(variantExists)

    drive.restore('s3')
  })

  test('does not regenerate variant if it already exists', async ({ assert }) => {
    drive.fake('s3')
    const disk = drive.use('s3')

    // Create a 500x500 image
    const originalBuffer = await sharp({
      create: {
        width: 500,
        height: 500,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

    await disk.put('uploads/test.png', originalBuffer)

    // Pre-create the 400px variant
    await disk.put('uploads/test-400.webp', Buffer.from('already-exists'))

    const file = {
      mimeType: 'image/png',
      disk: 's3',
      path: 'uploads/test.png',
      filename: 'test.png',
    } as any

    const result = await service.optimize(file, [400])

    // Should return the URL for the existing variant
    assert.property(result.variants, '400')

    // Ensure the content wasn't overwritten by checking the buffer
    const content = await disk.get('uploads/test-400.webp')
    assert.equal(content.toString(), 'already-exists')

    drive.restore('s3')
  })
})
