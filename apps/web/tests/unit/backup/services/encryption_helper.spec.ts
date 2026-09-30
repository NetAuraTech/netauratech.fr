import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from '@japa/runner';
import { createEncryptionHelper } from '#backup/services/encryption_helper';

/**
 * Unit tests for `EncryptionHelper` file encryption.
 *
 * Exercises the real file-based `encryptFile`/`decryptFile` pipeline on temp
 * files so the streamed GCM layout — including the auth tag appended after
 * the ciphertext — is verified end to end.
 */
test.group('EncryptionHelper', (group) => {
	let dir: string;

	group.each.setup(async () => {
		dir = await mkdtemp(join(tmpdir(), 'encryption-helper-'));
	});

	group.each.teardown(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	test('encryptFile writes the GCM layout with the auth tag after the ciphertext', async ({ assert }) => {
		const helper = createEncryptionHelper('test-app-key-0123456789');
		const inputPath = join(dir, 'data.sql');
		const outputPath = join(dir, 'data.sql.enc');
		const contents = "COPY public.pages FROM stdin;\n1\tPage d'accueil\n\\.";
		await writeFile(inputPath, contents);

		await helper.encryptFile(inputPath, outputPath);

		const encrypted = await readFile(outputPath);
		// [version(1)][salt(16)][iv(12)][ciphertext][tag(16)]
		assert.equal(encrypted[0], 1);
		assert.equal(encrypted.length, 1 + 16 + 12 + Buffer.byteLength(contents, 'utf8') + 16);
	});

	test('decryptFile restores the original content after a full round trip', async ({ assert }) => {
		const helper = createEncryptionHelper('test-app-key-0123456789');
		const inputPath = join(dir, 'data.sql');
		const encryptedPath = join(dir, 'data.sql.enc');
		const decryptedPath = join(dir, 'data.sql.dec');
		const contents = "1\tfr\tPage d'accueil du site\n2\ten\tPlain text\n";
		await writeFile(inputPath, contents);

		await helper.encryptFile(inputPath, encryptedPath);
		await helper.decryptFile(encryptedPath, decryptedPath);

		assert.equal(await readFile(decryptedPath, 'utf8'), contents);
	});

	test('decryptFile rejects when the ciphertext is tampered with', async ({ assert }) => {
		const helper = createEncryptionHelper('test-app-key-0123456789');
		const inputPath = join(dir, 'data.sql');
		const encryptedPath = join(dir, 'data.sql.enc');
		await writeFile(inputPath, 'some plaintext to encrypt');

		await helper.encryptFile(inputPath, encryptedPath);

		const encrypted = await readFile(encryptedPath);
		// Flip a ciphertext byte (between the header and the trailing tag)
		encrypted[encrypted.length - 20] ^= 0xff;
		await writeFile(encryptedPath, encrypted);

		await assert.rejects(
			() => helper.decryptFile(encryptedPath, join(dir, 'out.sql')),
			/unable to authenticate|Unsupported state/,
		);
	});
});
