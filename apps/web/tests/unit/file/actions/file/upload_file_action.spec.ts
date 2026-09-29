import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { UploadFileAction } from '#file/actions/file/upload_file_action';
import FileTooLargeException from '#file/exceptions/file_too_large_exception';
import InvalidExtensionException from '#file/exceptions/invalid_extension_exception';

test.group('UploadFileAction', () => {
	test('execute() throws FileTooLargeException when file exceeds size limit', async ({ assert }) => {
		const action = await app.container.make(UploadFileAction);

		const fakeFile = {
			extname: 'jpg',
			size: 999_999_999,
			clientName: 'large.jpg',
			type: 'image',
			subtype: 'jpeg',
			move: async () => {},
		} as any;

		await assert.rejects(async () => {
			await action.execute({ file: fakeFile });
		}, FileTooLargeException);
	});

	test('execute() throws InvalidExtensionException for disallowed extension', async ({ assert }) => {
		const action = await app.container.make(UploadFileAction);

		const fakeFile = {
			extname: 'exe',
			size: 1024,
			clientName: 'malware.exe',
			type: 'application',
			subtype: 'octet-stream',
			move: async () => {},
		} as any;

		await assert.rejects(async () => {
			await action.execute({ file: fakeFile });
		}, InvalidExtensionException);
	});
});
