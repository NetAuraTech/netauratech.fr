import { join } from 'node:path';
import { test } from '@japa/runner';
import sinon from 'sinon';

/**
 * Unit tests for `StorageUploader`.
 *
 * Passes mock drive disk and readFile directly via the constructor.
 */
test.group('StorageUploader', (group) => {
	let driveStub: {
		put: ReturnType<typeof sinon.stub>;
		listAll: ReturnType<typeof sinon.stub>;
		getMetaData: ReturnType<typeof sinon.stub>;
		exists: ReturnType<typeof sinon.stub>;
		getStream: ReturnType<typeof sinon.stub>;
		delete: ReturnType<typeof sinon.stub>;
	};

	group.each.setup(() => {
		driveStub = {
			put: sinon.stub().resolves(),
			listAll: sinon.stub().resolves({ objects: [] }),
			getMetaData: sinon.stub().resolves({ contentLength: 1024, lastModified: new Date() }),
			exists: sinon.stub().resolves(true),
			getStream: sinon.stub().resolves({}),
			delete: sinon.stub().resolves(),
		};
	});

	group.each.teardown(() => {
		sinon.restore();
	});

	// ─── buildPath() ──────────────────────────────────────────────────────────

	test('buildPath() prepends backup/ prefix', async ({ assert }) => {
		const readFileStub = sinon.stub().resolves(Buffer.from('data'));
		const { StorageUploader } = await import('#backup/services/storage_uploader');
		const uploader = new StorageUploader(driveStub as any, readFileStub);
		assert.equal(uploader.buildPath('dump.sql'), 'backup/dump.sql');
	});

	test('buildPath() preserves nested paths', async ({ assert }) => {
		const readFileStub = sinon.stub().resolves(Buffer.from('data'));
		const { StorageUploader } = await import('#backup/services/storage_uploader');
		const uploader = new StorageUploader(driveStub as any, readFileStub);
		assert.equal(uploader.buildPath('sub/dump.sql'), 'backup/sub/dump.sql');
	});

	// ─── upload() ─────────────────────────────────────────────────────────────

	test('upload() reads local file and uploads to drive', async ({ assert }) => {
		const fakeContents = Buffer.from('sql dump data');
		const readFileStub = sinon.stub().resolves(fakeContents);

		const putStub = sinon.stub().resolves();
		const diskMock = { put: putStub, listAll: sinon.stub(), getMetaData: sinon.stub() };

		const { StorageUploader } = await import('#backup/services/storage_uploader');
		const uploader = new StorageUploader(diskMock as any, readFileStub);

		await uploader.upload('/tmp/dump.sql', 'dump.sql');

		assert.isTrue(readFileStub.calledOnceWith('/tmp/dump.sql'));
		assert.isTrue(putStub.calledOnce);
		assert.equal(putStub.firstCall.args[0], 'backup/dump.sql');
		assert.deepEqual(putStub.firstCall.args[1], fakeContents);
		assert.equal(putStub.firstCall.args[2].contentType, 'application/octet-stream');
	});

	test('upload() propagates read errors', async ({ assert }) => {
		const readFileStub = sinon.stub().rejects(new Error('ENOENT'));
		const diskMock = { put: sinon.stub(), listAll: sinon.stub(), getMetaData: sinon.stub() };

		const { StorageUploader } = await import('#backup/services/storage_uploader');
		const uploader = new StorageUploader(diskMock as any, readFileStub);

		try {
			await uploader.upload('/tmp/nonexistent.sql', 'dump.sql');
			assert.fail('upload should have thrown');
		} catch (error) {
			assert.include(error.message, 'ENOENT');
		}
	});

	// ─── listBackups() ────────────────────────────────────────────────────────

	test('listBackups() lists objects under backup/ prefix', async ({ assert }) => {
		const fakeObjects = [
			{ key: 'backup/dump.sql', isDirectory: false },
			{ key: 'backup/manifest.json', isDirectory: false },
		];
		driveStub.listAll.resolves({ objects: fakeObjects as any });

		const readFileStub = sinon.stub().resolves(Buffer.from('data'));
		const { StorageUploader } = await import('#backup/services/storage_uploader');
		const uploader = new StorageUploader(driveStub as any, readFileStub);

		const result = await uploader.listBackups();
		assert.isTrue(driveStub.listAll.calledWith('backup/'));
		const arr = Array.from(result);
		assert.lengthOf(arr, 2);
	});

	// ─── getMetaData() ────────────────────────────────────────────────────────

	test('getMetaData() delegates to disk.getMetaData()', async ({ assert }) => {
		const meta = { contentLength: 2048, lastModified: new Date('2024-06-15') };
		driveStub.getMetaData.resolves(meta);

		const readFileStub = sinon.stub().resolves(Buffer.from('data'));
		const { StorageUploader } = await import('#backup/services/storage_uploader');
		const uploader = new StorageUploader(driveStub as any, readFileStub);

		const result = await uploader.getMetaData('backup/dump.sql.gz.enc');
		assert.isTrue(driveStub.getMetaData.calledWith('backup/dump.sql.gz.enc'));
		assert.equal(result.contentLength, 2048);
	});

	// ─── exists() ─────────────────────────────────────────────────────────────

	test('exists() checks the prefixed remote path', async ({ assert }) => {
		driveStub.exists.resolves(true);

		const readFileStub = sinon.stub().resolves(Buffer.from('data'));
		const { StorageUploader } = await import('#backup/services/storage_uploader');
		const uploader = new StorageUploader(driveStub as any, readFileStub);

		const result = await uploader.exists('dump.sql.gz.enc');
		assert.isTrue(driveStub.exists.calledWith('backup/dump.sql.gz.enc'));
		assert.isTrue(result);
	});

	test('exists() returns false when the object is missing', async ({ assert }) => {
		driveStub.exists.resolves(false);

		const readFileStub = sinon.stub().resolves(Buffer.from('data'));
		const { StorageUploader } = await import('#backup/services/storage_uploader');
		const uploader = new StorageUploader(driveStub as any, readFileStub);

		const result = await uploader.exists('missing.sql.gz.enc');
		assert.isTrue(driveStub.exists.calledWith('backup/missing.sql.gz.enc'));
		assert.isFalse(result);
	});

	// ─── delete() ─────────────────────────────────────────────────────────────

	test('delete() removes the prefixed remote path', async ({ assert }) => {
		driveStub.delete.resolves();

		const readFileStub = sinon.stub().resolves(Buffer.from('data'));
		const { StorageUploader } = await import('#backup/services/storage_uploader');
		const uploader = new StorageUploader(driveStub as any, readFileStub);

		await uploader.delete('dump.sql.gz.enc');
		assert.isTrue(driveStub.delete.calledWith('backup/dump.sql.gz.enc'));
	});

	// ─── download() ───────────────────────────────────────────────────────────

	test('download() pipes the remote stream into the local file', async ({ assert }) => {
		const fakeStream = { pipe: () => undefined };
		driveStub.getStream.resolves(fakeStream);

		const mkdirStub = sinon.stub().resolves();
		const createWriteStreamStub = sinon.stub().returns(fakeStream);
		const pipelineStub = sinon.stub().resolves();

		const readFileStub = sinon.stub().resolves(Buffer.from('data'));
		const { StorageUploader } = await import('#backup/services/storage_uploader');
		const uploader = new StorageUploader(driveStub as any, readFileStub, {
			_mkdir: mkdirStub,
			_createWriteStream: createWriteStreamStub,
			_pipeline: pipelineStub,
		});

		await uploader.download('dump.sql.gz.enc', '/tmp/backups/dump.sql.gz.enc');

		assert.isTrue(driveStub.getStream.calledWith('backup/dump.sql.gz.enc'));
		assert.isTrue(mkdirStub.calledWith(join('/tmp/backups/dump.sql.gz.enc', '..'), { recursive: true }));
		assert.isTrue(createWriteStreamStub.calledWith('/tmp/backups/dump.sql.gz.enc'));
		assert.isTrue(pipelineStub.calledWith(fakeStream, fakeStream));
	});
});
