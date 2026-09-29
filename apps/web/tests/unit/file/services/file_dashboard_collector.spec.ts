import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { FileFactory } from '#factories/file/file_factory';
import { FileFolderFactory } from '#factories/file/file_folder_factory';
import { FileDashboardCollector } from '#file/services/file_dashboard_collector';

/**
 * The test database is not truncated between tests, so count assertions are
 * expressed as deltas against a baseline snapshot taken before seeding.
 */
test.group('FileDashboardCollector', () => {
	test('collect() returns the file count matching seeded data', async ({ assert }) => {
		const collector = await app.container.make(FileDashboardCollector);
		const before = await collector.collect({ recentLimit: 5 });

		await FileFactory.createMany(2);

		const after = await collector.collect({ recentLimit: 5 });

		assert.equal(after.files, before.files + 2);
	});

	test('collect() counts folders and breaks down files per folder', async ({ assert }) => {
		const collector = await app.container.make(FileDashboardCollector);
		const before = await collector.collect({ recentLimit: 5 });

		const images = await FileFolderFactory.merge({ name: 'dash-images' }).create();
		const docs = await FileFolderFactory.merge({ name: 'dash-docs' }).create();
		await FileFolderFactory.merge({ name: 'dash-empty' }).create();
		await FileFactory.merge({ folderId: images.id }).createMany(2);
		await FileFactory.merge({ folderId: docs.id }).create();

		const section = await collector.collect({ recentLimit: 5 });

		assert.equal(section.fileFolders, before.fileFolders + 3);
		const imagesEntry = section.filesByFolder.find((entry) => entry.name === 'dash-images');
		const docsEntry = section.filesByFolder.find((entry) => entry.name === 'dash-docs');
		const emptyEntry = section.filesByFolder.find((entry) => entry.name === 'dash-empty');
		assert.deepEqual(imagesEntry?.count, 2);
		assert.deepEqual(imagesEntry?.id, images.id);
		assert.deepEqual(docsEntry?.count, 1);
		assert.deepEqual(emptyEntry?.count, 0);
	});

	test('collect() returns recent uploads ordered by recency and bounded by the limit', async ({ assert }) => {
		const collector = await app.container.make(FileDashboardCollector);

		// Explicit future timestamps keep ordering deterministic regardless of
		// rows created by other tests.
		const olderFile = await FileFactory.merge({
			createdAt: DateTime.now().plus({ days: 1 }),
		}).create();
		const newerFile = await FileFactory.merge({
			createdAt: DateTime.now().plus({ days: 2 }),
		}).create();

		const section = await collector.collect({ recentLimit: 5 });

		assert.equal(section.recentFiles[0].id, newerFile.id);
		assert.equal(section.recentFiles[1].id, olderFile.id);
		assert.isString(section.recentFiles[0].originalName);
		assert.isString(section.recentFiles[0].mimeType);
		assert.isNumber(section.recentFiles[0].size);
		assert.isTrue(DateTime.isDateTime(section.recentFiles[0].createdAt));

		const bounded = await collector.collect({ recentLimit: 1 });
		assert.lengthOf(bounded.recentFiles, 1);
	});
});
