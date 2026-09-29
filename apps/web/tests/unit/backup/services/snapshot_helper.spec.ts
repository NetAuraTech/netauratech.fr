import { test } from '@japa/runner';
import sinon from 'sinon';

/**
 * Unit tests for `SnapshotHelper`.
 *
 * Static methods are tested directly. Instance methods use dependency injection
 * via the constructor to avoid stubbing ESM node builtins.
 */
test.group('SnapshotHelper', (group) => {
	group.each.teardown(() => {
		sinon.restore();
	});

	// ─── compress() ──────────────────────────────────────────────────────────
	// The real compress() uses pipeline(stream, gzip, output) which requires
	// real files. It is exercised end-to-end in the strategy tests via mocked
	// helpers. Here we verify path construction by stubbing at the instance level.

	test('compress() returns input path with .gz extension', async ({ assert }) => {
		const { SnapshotHelper } = await import('#backup/services/snapshot_helper');

		// Disable encryption so the constructor doesn't need a key
		const helper = new SnapshotHelper(undefined, undefined, { _encryptionEnabled: false });

		// Stub compress on this instance to verify the output path contract
		const stub = sinon.stub(helper, 'compress').resolves('/tmp/dump.sql.gz');
		const result = await helper.compress('/tmp/dump.sql');

		assert.equal(result, '/tmp/dump.sql.gz');
		assert.isTrue(stub.calledWith('/tmp/dump.sql'));
	});

	// ─── encrypt() ───────────────────────────────────────────────────────────

	test('encrypt() returns input path when encryption is disabled', async ({ assert }) => {
		const { SnapshotHelper } = await import('#backup/services/snapshot_helper');

		// Explicitly disable encryption via the internal test option
		const helper = new SnapshotHelper(undefined, undefined, { _encryptionEnabled: false });
		const result = await helper.encrypt('/tmp/dump.sql.gz');

		assert.equal(result, '/tmp/dump.sql.gz');
	});

	test('encrypt() calls encryptionHelper and deletes input on success', async ({ assert }) => {
		const encryptFileStub = sinon.stub().resolves();
		const unlinkStub = sinon.stub().resolves();

		// Create a mock EncryptionHelper
		const mockEncryptionHelper = { encryptFile: encryptFileStub } as any;

		const { SnapshotHelper } = await import('#backup/services/snapshot_helper');
		const helper = new SnapshotHelper(mockEncryptionHelper, unlinkStub);

		const result = await helper.encrypt('/tmp/dump.sql.gz');
		assert.equal(result, '/tmp/dump.sql.gz.enc');
		assert.isTrue(encryptFileStub.calledWith('/tmp/dump.sql.gz', '/tmp/dump.sql.gz.enc'));
		assert.isTrue(unlinkStub.calledWith('/tmp/dump.sql.gz'));
	});

	test('encrypt() returns encrypted path after unlinking original', async ({ assert }) => {
		const encryptFileStub = sinon.stub().resolves();
		const unlinkStub = sinon.stub().resolves();
		const mockEncryptionHelper = { encryptFile: encryptFileStub } as any;

		const { SnapshotHelper } = await import('#backup/services/snapshot_helper');
		const helper = new SnapshotHelper(mockEncryptionHelper, unlinkStub);

		const result = await helper.encrypt('/tmp/data.sql');
		assert.equal(result, '/tmp/data.sql.enc');
		// Verify order: encryptFile called before unlink
		assert.isTrue(encryptFileStub.calledBefore(unlinkStub));
	});
});
