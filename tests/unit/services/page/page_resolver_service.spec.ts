/**
 * Unit tests for `PageResolverService`.
 *
 * Two stubs are needed:
 * 1. `CmsFile.query` — prevents any real DB call
 * 2. `file.url()` on each model instance — the model's `url()` method calls
 *    its own internal storage; since we build instances manually we stub the
 *    method directly on each object instead of relying on StorageService injection.
 *
 * `file.resolveAlt()` uses only `this.alts` (already populated) so it runs
 * as-is with no stub required.
 */
/*
test.group('PageResolverService', (group) => {
  let storageStub: Record<string, sinon.SinonStub>
  let queryStub: sinon.SinonStub
  let service: PageResolverService

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function makeFileModel(
    id: number,
    alts: { locale: string; key: string; value: string }[] = []
  ): CmsFile {
    const file = new CmsFile()
    file.id = id
    file.filename = `file-${id}.jpg`
    file.mimeType = 'image/jpeg'
    file.extension = 'jpg'
    file.size = 1024
    file.path = `cms/files/file-${id}.jpg`
    file.disk = 'fs'
    const resolvedAlts = alts.map((a) => Object.assign(new FileAlt(), a))
    file.$setRelated('alts', resolvedAlts)

    // Stub url() directly on the instance — the model method calls its own
    // internal storage which isn't available in unit tests.
    file.url = sinon.stub().resolves(`https://cdn.example.com/cms/files/file-${id}.jpg`)

    return file
  }

  function mockQuery(files: CmsFile[]) {
    queryStub = sinon.stub(CmsFile, 'query').returns({
      whereIn: sinon.stub().returnsThis(),
      preload: sinon.stub().resolves(files),
    } as any)
  }

  group.each.setup(() => {
    storageStub = {
      url: sinon.stub().callsFake(async (path: string) => `https://cdn.example.com/${path}`),
    }
    const fileRepository = new FileRepository()
    service = new PageResolverService(fileRepository, storageStub as unknown as StorageService)
  })

  group.each.teardown(() => sinon.restore())

  // ─── Empty content ─────────────────────────────────────────────────────────

  test('returns empty blocks array for empty content', async ({ assert }) => {
    const content: PageContent = { blocks: [] }
    const result = await service.resolve(content, 'en')
    assert.deepEqual(result, { blocks: [] })
    // No DB call expected when there are no file IDs
    assert.isUndefined(queryStub)
  })

  // ─── Non-file blocks passed through unchanged ──────────────────────────────

  test('passes title blocks through unchanged', async ({ assert }) => {
    mockQuery([])
    const content: PageContent = {
      blocks: [
        { id: '1', type: 'title', props: { text: 'Hello', level: 1, align: 'left', color: null } },
      ],
    }
    const result = await service.resolve(content, 'en')
    assert.equal(result.blocks[0].type, 'title')
    assert.equal((result.blocks[0].props as any).text, 'Hello')
  })

  test('passes separator blocks through unchanged', async ({ assert }) => {
    mockQuery([])
    const content: PageContent = {
      blocks: [
        { id: '1', type: 'separator', props: { style: 'solid', spacing: 'md', color: null } },
      ],
    }
    const result = await service.resolve(content, 'en')
    assert.equal(result.blocks[0].type, 'separator')
  })

  // ─── Hero block — image resolution ────────────────────────────────────────

  test('resolves FileRef in hero block to ResolvedFile', async ({ assert }) => {
    const file = makeFileModel(10, [{ locale: 'en', key: 'hero', value: 'Hero image' }])
    mockQuery([file])

    const content: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'hero',
          props: {
            title: 'Welcome',
            subtitle: null,
            cta: null,
            image: { fileId: 10, altKey: 'hero', altOverride: null },
            align: 'center',
            background: 'canvas',
            minHeight: 'md',
          },
        },
      ],
    }

    const result = await service.resolve(content, 'en')
    const resolved = result.blocks[0].props as any

    assert.equal(resolved.image.id, 10)
    assert.equal(resolved.image.url, 'https://cdn.example.com/cms/files/file-10.jpg')
    assert.equal(resolved.image.alt, 'Hero image')
    assert.equal(resolved.image.mimeType, 'image/jpeg')
    assert.equal(resolved.image.extension, 'jpg')
  })

  test('resolves hero image alt using altOverride when truthy', async ({ assert }) => {
    const file = makeFileModel(10, [{ locale: 'en', key: 'hero', value: 'Named alt' }])
    mockQuery([file])

    const content: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'hero',
          props: {
            title: 'Hero',
            subtitle: null,
            cta: null,
            image: { fileId: 10, altKey: 'hero', altOverride: 'Override alt' },
            align: 'center',
            background: 'canvas',
            minHeight: 'auto',
          },
        },
      ],
    }

    const result = await service.resolve(content, 'en')
    assert.equal((result.blocks[0].props as any).image.alt, 'Override alt')
  })

  test('sets hero image to null when FileRef points to a missing file', async ({ assert }) => {
    mockQuery([])

    const content: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'hero',
          props: {
            title: 'Hero',
            subtitle: null,
            cta: null,
            image: { fileId: 999, altKey: null, altOverride: null },
            align: 'center',
            background: 'canvas',
            minHeight: 'auto',
          },
        },
      ],
    }

    const result = await service.resolve(content, 'en')
    assert.isNull((result.blocks[0].props as any).image)
  })

  test('sets hero image to null when props.image is null', async ({ assert }) => {
    mockQuery([])

    const content: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'hero',
          props: {
            title: 'Hero',
            subtitle: null,
            cta: null,
            image: null,
            align: 'center',
            background: 'canvas',
            minHeight: 'auto',
          },
        },
      ],
    }

    const result = await service.resolve(content, 'en')
    assert.isNull((result.blocks[0].props as any).image)
  })

  // ─── Image block — file resolution ────────────────────────────────────────

  test('resolves FileRef in image block to ResolvedFile', async ({ assert }) => {
    const file = makeFileModel(20, [{ locale: 'en', key: 'thumbnail', value: 'Thumbnail' }])
    mockQuery([file])

    const content: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'image',
          props: {
            file: { fileId: 20, altKey: 'thumbnail', altOverride: null },
            caption: 'My caption',
            fit: 'cover',
            rounded: true,
            fullWidth: false,
          },
        },
      ],
    }

    const result = await service.resolve(content, 'en')
    const resolved = result.blocks[0].props as any
    assert.equal(resolved.file.id, 20)
    assert.equal(resolved.file.alt, 'Thumbnail')
    assert.equal(resolved.caption, 'My caption')
  })

  test('sets image file to null when props.file is null', async ({ assert }) => {
    mockQuery([])

    const content: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'image',
          props: { file: null, caption: null, fit: 'cover', rounded: false, fullWidth: true },
        },
      ],
    }

    const result = await service.resolve(content, 'en')
    assert.isNull((result.blocks[0].props as any).file)
  })

  // ─── Batch loading ─────────────────────────────────────────────────────────

  test('loads all file IDs in a single DB query', async ({ assert }) => {
    const file10 = makeFileModel(10)
    const file20 = makeFileModel(20)
    mockQuery([file10, file20])

    const content: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'hero',
          props: {
            title: 'Hero',
            subtitle: null,
            cta: null,
            image: { fileId: 10, altKey: null, altOverride: null },
            align: 'center',
            background: 'canvas',
            minHeight: 'auto',
          },
        },
        {
          id: '2',
          type: 'image',
          props: {
            file: { fileId: 20, altKey: null, altOverride: null },
            caption: null,
            fit: 'cover',
            rounded: false,
            fullWidth: false,
          },
        },
      ],
    }

    await service.resolve(content, 'en')

    assert.isTrue(queryStub.calledOnce, 'CmsFile.query() should be called exactly once')
  })

  test('deduplicates file IDs when the same file appears in multiple blocks', async ({
    assert,
  }) => {
    const file10 = makeFileModel(10)
    mockQuery([file10])

    const content: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'hero',
          props: {
            title: 'Hero',
            subtitle: null,
            cta: null,
            image: { fileId: 10, altKey: null, altOverride: null },
            align: 'center',
            background: 'canvas',
            minHeight: 'auto',
          },
        },
        {
          id: '2',
          type: 'image',
          props: {
            file: { fileId: 10, altKey: null, altOverride: null }, // same file ID
            caption: null,
            fit: 'cover',
            rounded: false,
            fullWidth: false,
          },
        },
      ],
    }

    await service.resolve(content, 'en')

    // whereIn should be called with [10] only, not [10, 10]
    const queryBuilder = queryStub.returnValues[0]
    const whereInArgs: number[] = queryBuilder.whereIn.firstCall.args[1]
    assert.deepEqual(whereInArgs, [10])
  })

  // ─── Recursive resolution ─────────────────────────────────────────────────

  test('resolves FileRef inside nested blocks (section > image)', async ({ assert }) => {
    const file = makeFileModel(30)
    mockQuery([file])

    const content: PageContent = {
      blocks: [
        {
          id: 'section1',
          type: 'section',
          props: {
            background: 'canvas',
            paddingY: { default: 'md' },
            paddingX: { default: 'md' },
            maxWidth: 'xl',
            rounded: false,
          },
          children: [
            {
              id: 'img1',
              type: 'image',
              props: {
                file: { fileId: 30, altKey: null, altOverride: 'Nested image' },
                caption: null,
                fit: 'cover',
                rounded: false,
                fullWidth: false,
              },
            },
          ],
        },
      ],
    }

    const result = await service.resolve(content, 'en')
    const nested = result.blocks[0].children![0].props as any
    assert.equal(nested.file.id, 30)
    assert.equal(nested.file.alt, 'Nested image')
  })

  // ─── Original content not mutated ─────────────────────────────────────────

  test('does not mutate the original content object', async ({ assert }) => {
    const file = makeFileModel(10)
    mockQuery([file])

    const originalRef = { fileId: 10, altKey: null, altOverride: null }
    const content: PageContent = {
      blocks: [
        {
          id: '1',
          type: 'image',
          props: {
            file: originalRef,
            caption: null,
            fit: 'cover',
            rounded: false,
            fullWidth: false,
          },
        },
      ],
    }

    await service.resolve(content, 'en')

    // The original props.file should still be the FileRef, not the resolved object
    assert.equal((content.blocks[0].props as any).file, originalRef)
    assert.notProperty((content.blocks[0].props as any).file, 'url')
  })

  // ─── Block structure preserved ────────────────────────────────────────────

  test('preserves block id and type in resolved output', async ({ assert }) => {
    mockQuery([])
    const content: PageContent = {
      blocks: [
        {
          id: 'unique-id-123',
          type: 'separator',
          props: { style: 'dashed', spacing: 'lg', color: null },
        },
      ],
    }
    const result = await service.resolve(content, 'en')
    assert.equal(result.blocks[0].id, 'unique-id-123')
    assert.equal(result.blocks[0].type, 'separator')
  })

  test('preserves children array structure in resolved output', async ({ assert }) => {
    mockQuery([])
    const content: PageContent = {
      blocks: [
        {
          id: 'grid1',
          type: 'grid',
          props: { cols: { default: 2 }, gap: { default: 'md' } },
          children: [
            {
              id: 'title1',
              type: 'title',
              props: { text: 'A', level: 2, align: 'left', color: null },
            },
            {
              id: 'title2',
              type: 'title',
              props: { text: 'B', level: 2, align: 'left', color: null },
            },
          ],
        },
      ],
    }
    const result = await service.resolve(content, 'en')
    assert.lengthOf(result.blocks[0].children!, 2)
    assert.equal(result.blocks[0].children![0].id, 'title1')
    assert.equal(result.blocks[0].children![1].id, 'title2')
  })
})
*/
