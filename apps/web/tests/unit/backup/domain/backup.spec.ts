import { test } from '@japa/runner';
import { BackupMetadata } from '#backup/domain/backup';

/**
 * Unit tests for the {@link BackupMetadata} domain object — the single owner
 * of the backup filename grammar.
 */
test.group('BackupMetadata', () => {
	// ─── generateFilename() ──────────────────────────────────────────────────

	test('generateFilename() produces correctly formatted full backup filename', ({ assert }) => {
		const filename = BackupMetadata.generateFilename('full');
		// Format: backup-full-YYYY-MM-DD-HHMMSS.sql.gz.enc (compression + encryption enabled by default)
		assert.match(filename, /^backup-full-\d{4}-\d{2}-\d{2}-\d{6}\.sql\.gz\.enc$/);
	});

	test('generateFilename() produces correctly formatted differential filename', ({ assert }) => {
		const filename = BackupMetadata.generateFilename('differential');
		assert.match(filename, /^backup-differential-\d{4}-\d{2}-\d{2}-\d{6}\.sql\.gz\.enc$/);
	});

	// ─── manifestFilename() ──────────────────────────────────────────────────

	test('manifestFilename() strips all extensions and appends .manifest.json', ({ assert }) => {
		assert.equal(
			BackupMetadata.manifestFilename('backup-full-2024-01-01-020000.sql.gz.enc'),
			'backup-full-2024-01-01-020000.manifest.json',
		);
	});

	test('manifestFilename() handles filename without encryption extension', ({ assert }) => {
		assert.equal(
			BackupMetadata.manifestFilename('backup-full-2024-01-01-020000.sql.gz'),
			'backup-full-2024-01-01-020000.manifest.json',
		);
	});

	test('manifestFilename() handles plain sql filename', ({ assert }) => {
		assert.equal(
			BackupMetadata.manifestFilename('backup-full-2024-01-01-020000.sql'),
			'backup-full-2024-01-01-020000.manifest.json',
		);
	});

	// ─── parseFilename() ─────────────────────────────────────────────────────

	test('parseFilename() parses a full backup filename into type and timestamp', ({ assert }) => {
		const parsed = BackupMetadata.parseFilename('backup-full-2024-01-15-143022.sql.gz.enc');

		assert.isNotNull(parsed);
		assert.equal(parsed!.type, 'full');
		assert.instanceOf(parsed!.createdAt, Date);
		assert.equal(parsed!.createdAt.getFullYear(), 2024);
		assert.equal(parsed!.createdAt.getMonth(), 0);
		assert.equal(parsed!.createdAt.getDate(), 15);
		assert.equal(parsed!.createdAt.getHours(), 14);
		assert.equal(parsed!.createdAt.getMinutes(), 30);
		assert.equal(parsed!.createdAt.getSeconds(), 22);
	});

	test('parseFilename() parses a differential backup filename', ({ assert }) => {
		const parsed = BackupMetadata.parseFilename('backup-differential-2024-01-16-100000.sql');

		assert.isNotNull(parsed);
		assert.equal(parsed!.type, 'differential');
	});

	test('parseFilename() returns null for non-backup filenames', ({ assert }) => {
		assert.isNull(BackupMetadata.parseFilename('page.json'));
		assert.isNull(BackupMetadata.parseFilename('manifest-full-2024-01-15-143022.manifest.json'));
		assert.isNull(BackupMetadata.parseFilename('backup-weekly-2024-01-15-143022.sql.gz.enc'));
	});

	test('parseFilename() returns null when the grammar is not at the start of the filename', ({ assert }) => {
		assert.isNull(BackupMetadata.parseFilename('prefix-backup-full-2024-01-15-143022.sql.gz.enc'));
	});

	test('parseFilename() returns null for malformed timestamps', ({ assert }) => {
		assert.isNull(BackupMetadata.parseFilename('backup-full-2024-01-15.sql.gz.enc'));
		assert.isNull(BackupMetadata.parseFilename('backup-full-20240115-143022.sql.gz.enc'));
	});

	// ─── fromStorageObject() ─────────────────────────────────────────────────

	test('fromStorageObject() builds metadata from a storage listing', ({ assert }) => {
		const lastModified = new Date(2024, 0, 15, 14, 30, 22);
		const meta = BackupMetadata.fromStorageObject(
			'backup-full-2024-01-15-143022.sql.gz.enc',
			{
				contentLength: 2048,
				lastModified,
			},
			'backup/backup-full-2024-01-15-143022.sql.gz.enc',
		);

		assert.isNotNull(meta);
		assert.equal(meta!.filename, 'backup-full-2024-01-15-143022.sql.gz.enc');
		assert.equal(meta!.type, 'full');
		assert.equal(meta!.size, 2048);
		assert.equal(meta!.createdAt.getTime(), lastModified.getTime());
		assert.equal(meta!.path, 'backup/backup-full-2024-01-15-143022.sql.gz.enc');
	});

	test('fromStorageObject() falls back to the filename timestamp when no last-modified stamp is available', ({
		assert,
	}) => {
		const meta = BackupMetadata.fromStorageObject('backup-differential-2024-01-16-100000.sql', {}, 'key');

		assert.isNotNull(meta);
		assert.equal(meta!.type, 'differential');
		assert.equal(meta!.size, 0);
		assert.equal(meta!.createdAt.getFullYear(), 2024);
		assert.equal(meta!.createdAt.getMonth(), 0);
		assert.equal(meta!.createdAt.getDate(), 16);
	});

	test('fromStorageObject() returns null for non-backup filenames', ({ assert }) => {
		assert.isNull(BackupMetadata.fromStorageObject('readme.txt', { contentLength: 10 }, 'backup/readme.txt'));
	});

	// ─── equals() ────────────────────────────────────────────────────────────

	test('equals() compares values, as a value object without identity', ({ assert }) => {
		const meta = BackupMetadata.fromStorageObject('backup-full-2024-01-15-143022.sql', {}, 'key');
		const same = BackupMetadata.fromStorageObject('backup-full-2024-01-15-143022.sql', {}, 'key');
		const other = BackupMetadata.fromStorageObject('backup-full-2024-01-16-143022.sql', {}, 'key');

		assert.isTrue(meta!.equals(same!));
		assert.isFalse(meta!.equals(other!));
	});
});
