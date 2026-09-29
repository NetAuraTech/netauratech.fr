import { test } from '@japa/runner';
import sinon from 'sinon';
import { File } from '#file/domain/file';
import { ImageOptimizerService } from '#file/services/image_optimizer_service';
import { StorageService } from '#file/services/storage_service';
import FileTransformer from '#transport/file/transformers/file_transformer';
import type { ResolvedFile } from '#types/file';

/**
 * Unit tests for `FileTransformer`.
 * Focus: the render-ready output shape (url, variants, resolved alt, type)
 * produced when a display intent is provided.
 */
test.group('FileTransformer', (group) => {
	function makeFile(alts: { locale: string; key: string; value: string }[] = []): File {
		return File.fromModel({
			id: 1,
			filename: 'hero.jpg',
			originalName: 'photo.jpg',
			mimeType: 'image/jpeg',
			extension: 'jpg',
			size: 2048,
			path: 'cms/files/hero.jpg',
			disk: 'fs',
			folderId: null,
			alts,
		});
	}

	async function render(file: File, options?: { locale?: string; altKey?: string | null }) {
		return (await new FileTransformer(file, options).toObject()) as unknown as ResolvedFile & {
			originalName: string;
			createdAt: unknown;
		};
	}

	group.each.setup(() => {
		sinon.stub(ImageOptimizerService.prototype, 'optimize').resolves({
			width: 800,
			height: 600,
			variants: { 400: 'https://cdn.example.com/hero-400.webp' },
		});
		sinon.stub(StorageService.prototype, 'url').resolves('https://cdn.example.com/hero.jpg');
	});

	group.each.teardown(() => sinon.restore());

	test('render output carries url, variants, resolved alt and type', async ({ assert }) => {
		const file = makeFile([{ locale: 'en', key: 'hero', value: 'Hero alt' }]);

		const result = await render(file, { locale: 'en', altKey: 'hero' });

		assert.equal(result.url, 'https://cdn.example.com/hero.jpg');
		assert.equal(result.alt, 'Hero alt');
		assert.equal(result.type, 'image');
		assert.property(result.variants, '400');
		assert.equal(result.width, 800);
		assert.equal(result.height, 600);
	});

	test('render output resolves alt through the shared chain', async ({ assert }) => {
		const file = makeFile([{ locale: 'en', key: 'hero', value: 'English alt' }]);

		const result = await render(file, { locale: 'fr', altKey: 'hero' });

		assert.equal(result.alt, 'English alt');
	});

	test('non-render output keeps the lean admin/API shape', async ({ assert }) => {
		const file = makeFile([{ locale: 'en', key: 'hero', value: 'Hero alt' }]);

		const result = await render(file);

		assert.equal(result.id, 1);
		assert.equal(result.filename, 'hero.jpg');
		assert.equal(result.originalName, 'photo.jpg');
		assert.equal(result.url, 'https://cdn.example.com/hero.jpg');
		assert.isUndefined(result.variants);
		assert.equal(result.alt, 'Hero alt');
		assert.equal(result.type, 'image');
	});
});
