import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import emitter from '@adonisjs/core/services/emitter';
import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import { FileFactory } from '#factories/file/file_factory';
import { FileFolderFactory } from '#factories/file/file_folder_factory';
import User from '#identity/models/user';
import { createAdminUser } from '#tests/helpers/create_admin_user';
import { resetSharedState } from '#tests/helpers/shared_state';

const tmpDir = path.join(process.cwd(), 'tmp');

test.group('Admin REST API v1 — Files', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	group.each.setup(async () => {
		await mkdir(tmpDir, { recursive: true });
	});
	group.each.setup(() => {
		emitter.fake();
		return () => emitter.restore();
	});
	group.each.teardown(() => limiter.clear());
	group.each.teardown(async () => {
		await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
	});
	test('lists files as a paginated payload', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-files-list@example.com',
			permissionSlugs: ['files.view'],
		});
		const token = await User.accessTokens.create(admin);

		await FileFactory.createMany(3);

		const res = await client
			.get('/api/v1/admin/files?page=1&perPage=2')
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(200);
		const body = res.body();
		assert.isArray(body.data);
		assert.isAtMost(body.data.length, 2);
		assert.exists(body.metadata);
		assert.exists(body.metadata.total);
	});

	test('list files filters by folder_id', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-files-filter@example.com',
			permissionSlugs: ['files.view'],
		});
		const token = await User.accessTokens.create(admin);

		const folder = await FileFolderFactory.merge({ name: 'filter-folder' }).create();
		await FileFactory.create();
		await FileFactory.merge({ folderId: folder.id }).create();

		const res = await client
			.get(`/api/v1/admin/files?folder_id=${folder.id}`)
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(200);
		const folderIds = res.body().data.map((f: any) => f.folderId);
		assert.isTrue(folderIds.every((fid: any) => fid === folder.id));
	});

	test('list files filters by mime_type', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-files-mime@example.com',
			permissionSlugs: ['files.view'],
		});
		const token = await User.accessTokens.create(admin);

		await FileFactory.merge({ mimeType: 'image/png' }).create();
		await FileFactory.merge({ mimeType: 'application/pdf' }).create();

		const res = await client
			.get('/api/v1/admin/files?mime_type=image')
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(200);
		const mimes = res.body().data.map((f: any) => f.mimeType);
		assert.isTrue(mimes.every((m: string) => m.startsWith('image')));
	});

	test('list files returns 401 without token', async ({ client }) => {
		const res = await client.get('/api/v1/admin/files').accept('json');
		res.assertStatus(401);
	});

	test('list files returns 403 without files.view', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'noperm-files-list@example.com',
			permissionSlugs: [],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client.get('/api/v1/admin/files').accept('json').bearerToken(token.value!.release());

		res.assertStatus(403);
	});

	test('shows a file by id', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-files-show@example.com',
			permissionSlugs: ['files.view'],
		});
		const token = await User.accessTokens.create(admin);

		const file = await FileFactory.create();

		const res = await client.get(`/api/v1/admin/files/${file.id}`).accept('json').bearerToken(token.value!.release());

		res.assertStatus(200);
		assert.equal(res.body().data.id, file.id);
		assert.equal(res.body().data.filename, file.filename);
	});

	test('show returns 404 for unknown id', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-files-show-404@example.com',
			permissionSlugs: ['files.view'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client.get('/api/v1/admin/files/999999').accept('json').bearerToken(token.value!.release());

		res.assertStatus(404);
	});

	test('moves a file to a folder', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-files-move@example.com',
			permissionSlugs: ['files.view', 'files.update'],
		});
		const token = await User.accessTokens.create(admin);

		const file = await FileFactory.create();
		const folder = await FileFolderFactory.merge({ name: 'move-target' }).create();

		const res = await client
			.put(`/api/v1/admin/files/${file.id}/move`)
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ folder_id: folder.id });

		res.assertStatus(200);
		assert.equal(res.body().data.folderId, folder.id);
	});

	test('move returns 422 on invalid folder_id', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-files-move-invalid@example.com',
			permissionSlugs: ['files.update'],
		});
		const token = await User.accessTokens.create(admin);

		const file = await FileFactory.create();

		const res = await client
			.put(`/api/v1/admin/files/${file.id}/move`)
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ folder_id: 'not-a-number' });

		res.assertStatus(422);
	});

	test('move returns 404 for unknown file', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-files-move-404@example.com',
			permissionSlugs: ['files.update'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client
			.put('/api/v1/admin/files/999999/move')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ folder_id: null });

		res.assertStatus(404);
	});

	test('deletes a file and returns 204', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-files-delete@example.com',
			permissionSlugs: ['files.delete'],
		});
		const token = await User.accessTokens.create(admin);

		const file = await FileFactory.create();

		const res = await client
			.delete(`/api/v1/admin/files/${file.id}`)
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(204);
	});

	test('delete returns 404 for unknown id', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-files-delete-404@example.com',
			permissionSlugs: ['files.delete'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client.delete('/api/v1/admin/files/999999').accept('json').bearerToken(token.value!.release());

		res.assertStatus(404);
	});

	test('delete returns 403 without files.delete', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'noperm-files-delete@example.com',
			permissionSlugs: ['files.view'],
		});
		const token = await User.accessTokens.create(admin);
		const file = await FileFactory.create();

		const res = await client
			.delete(`/api/v1/admin/files/${file.id}`)
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(403);
	});

	test('upserts alt text on a file', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-files-alt-upsert@example.com',
			permissionSlugs: ['files.view', 'files.update'],
		});
		const token = await User.accessTokens.create(admin);

		const file = await FileFactory.create();

		const res = await client
			.put(`/api/v1/admin/files/${file.id}/alt`)
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ locale: 'en', key: 'default', value: 'Alt text for image' });

		res.assertStatus(200);
		assert.exists(res.body().data);
	});

	test('uploads a file and returns it with 201', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-files-upload@example.com',
			permissionSlugs: ['files.create'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client
			.post('/api/v1/admin/files')
			.accept('json')
			.bearerToken(token.value!.release())
			.file('file', path.join(process.cwd(), 'tests', 'fixtures', 'test-image.png'));

		res.assertStatus(201);
		assert.exists(res.body().data.id);
		assert.equal(res.body().data.mimeType, 'image/png');
	});

	test('upload returns 400 when no file is attached', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-files-upload-nofile@example.com',
			permissionSlugs: ['files.create'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client.post('/api/v1/admin/files').accept('json').bearerToken(token.value!.release());

		res.assertStatus(400);
	});

	test('upload returns 403 without files.create', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'noperm-files-upload@example.com',
			permissionSlugs: [],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client
			.post('/api/v1/admin/files')
			.accept('json')
			.bearerToken(token.value!.release())
			.file('file', path.join(process.cwd(), 'tests', 'fixtures', 'test-image.png'));

		res.assertStatus(403);
	});

	test('alt upsert returns 422 on invalid payload', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-files-alt-invalid@example.com',
			permissionSlugs: ['files.update'],
		});
		const token = await User.accessTokens.create(admin);

		const file = await FileFactory.create();

		const res = await client
			.put(`/api/v1/admin/files/${file.id}/alt`)
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ key: 'default' });

		res.assertStatus(422);
	});

	test('deletes alt text from a file', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-files-alt-delete@example.com',
			permissionSlugs: ['files.view', 'files.update'],
		});
		const token = await User.accessTokens.create(admin);

		const file = await FileFactory.create();

		await client
			.put(`/api/v1/admin/files/${file.id}/alt`)
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ locale: 'en', key: 'default', value: 'Some alt' });

		const res = await client
			.delete(`/api/v1/admin/files/${file.id}/alt`)
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ locale: 'en', key: 'default' });

		res.assertStatus(200);
	});
});

test.group('Admin REST API v1 — Folders', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	group.each.setup(() => {
		emitter.fake();
		return () => emitter.restore();
	});
	group.each.teardown(() => limiter.clear());

	test('lists root-folders', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-list@example.com',
			permissionSlugs: ['folders.view'],
		});
		const token = await User.accessTokens.create(admin);

		await FileFolderFactory.merge({ name: 'Root-A' }).create();
		await FileFolderFactory.merge({ name: 'Root-B' }).create();

		const res = await client.get('/api/v1/admin/folders').accept('json').bearerToken(token.value!.release());

		res.assertStatus(200);
		assert.isArray(res.body().data);
		assert.lengthOf(res.body().data, 2);
	});

	test('list root-folders returns 401 without token', async ({ client }) => {
		const res = await client.get('/api/v1/admin/folders').accept('json');
		res.assertStatus(401);
	});

	test('list root-folders returns 403 without folders.view', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'noperm-folders@example.com',
			permissionSlugs: [],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client.get('/api/v1/admin/folders').accept('json').bearerToken(token.value!.release());

		res.assertStatus(403);
	});

	test('creates a folder and returns it with 201', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-create@example.com',
			permissionSlugs: ['folders.create'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client
			.post('/api/v1/admin/folders')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ name: 'New Folder' });

		res.assertStatus(201);
		assert.equal(res.body().data.name, 'New Folder');
	});

	test('create returns 422 on empty name', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-create-invalid@example.com',
			permissionSlugs: ['folders.create'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client
			.post('/api/v1/admin/folders')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ name: '' });

		res.assertStatus(422);
	});

	test('create returns 403 without folders.create', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'noperm-folders-create@example.com',
			permissionSlugs: [],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client
			.post('/api/v1/admin/folders')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ name: 'Forbidden' });

		res.assertStatus(403);
	});

	test('shows a folder by id', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-show@example.com',
			permissionSlugs: ['folders.view'],
		});
		const token = await User.accessTokens.create(admin);

		const folder = await FileFolderFactory.merge({ name: 'Show-Me' }).create();

		const res = await client
			.get(`/api/v1/admin/folders/${folder.id}`)
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(200);
		assert.equal(res.body().data.id, folder.id);
	});

	test('show returns 404 for unknown id', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-show-404@example.com',
			permissionSlugs: ['folders.view'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client.get('/api/v1/admin/folders/999999').accept('json').bearerToken(token.value!.release());

		res.assertStatus(404);
	});

	test('lists children of a folder', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-children@example.com',
			permissionSlugs: ['folders.view'],
		});
		const token = await User.accessTokens.create(admin);

		const parent = await FileFolderFactory.merge({ name: 'Parent' }).create();
		await FileFolderFactory.merge({ name: 'Child-A', parentId: parent.id }).create();
		await FileFolderFactory.merge({ name: 'Child-B', parentId: parent.id }).create();

		const res = await client
			.get(`/api/v1/admin/folders/${parent.id}/children`)
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(200);
		assert.isArray(res.body().data);
		assert.lengthOf(res.body().data, 2);
	});

	test('children returns 404 for unknown folder', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-children-404@example.com',
			permissionSlugs: ['folders.view'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client
			.get('/api/v1/admin/folders/999999/children')
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(404);
	});

	test('renames a folder', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-rename@example.com',
			permissionSlugs: ['folders.view', 'folders.update'],
		});
		const token = await User.accessTokens.create(admin);

		const folder = await FileFolderFactory.merge({ name: 'Old Name' }).create();

		const res = await client
			.put(`/api/v1/admin/folders/${folder.id}`)
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ name: 'New Name' });

		res.assertStatus(200);
		assert.equal(res.body().data.name, 'New Name');
	});

	test('rename returns 422 on empty name', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-rename-invalid@example.com',
			permissionSlugs: ['folders.update'],
		});
		const token = await User.accessTokens.create(admin);

		const folder = await FileFolderFactory.merge({ name: 'Temp' }).create();

		const res = await client
			.put(`/api/v1/admin/folders/${folder.id}`)
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ name: '' });

		res.assertStatus(422);
	});

	test('rename returns 404 for unknown folder', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-rename-404@example.com',
			permissionSlugs: ['folders.update'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client
			.put('/api/v1/admin/folders/999999')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ name: 'New' });

		res.assertStatus(404);
	});

	test('deletes a folder and returns 204', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-delete@example.com',
			permissionSlugs: ['folders.delete'],
		});
		const token = await User.accessTokens.create(admin);

		const folder = await FileFolderFactory.merge({ name: 'Deletable' }).create();

		const res = await client
			.delete(`/api/v1/admin/folders/${folder.id}`)
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(204);
	});

	test('delete returns 404 for unknown id', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'admin-folders-delete-404@example.com',
			permissionSlugs: ['folders.delete'],
		});
		const token = await User.accessTokens.create(admin);

		const res = await client.delete('/api/v1/admin/folders/999999').accept('json').bearerToken(token.value!.release());

		res.assertStatus(404);
	});

	test('delete returns 403 without folders.delete', async ({ client }) => {
		const admin = await createAdminUser({
			email: 'noperm-folders-delete@example.com',
			permissionSlugs: ['folders.view'],
		});
		const token = await User.accessTokens.create(admin);
		const folder = await FileFolderFactory.merge({ name: 'Cant Delete' }).create();

		const res = await client
			.delete(`/api/v1/admin/folders/${folder.id}`)
			.accept('json')
			.bearerToken(token.value!.release());

		res.assertStatus(403);
	});
});
