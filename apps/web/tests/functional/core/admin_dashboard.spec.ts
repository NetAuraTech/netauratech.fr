import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';
import { FileFactory } from '#factories/file/file_factory';
import { FileFolderFactory } from '#factories/file/file_folder_factory';
import { createAdminUser } from '#tests/helpers/create_admin_user';
import { parseInertiaPage } from '#tests/helpers/inertia_page';

const VIEW_PERMISSIONS = ['users.view', 'files.view'] as const;

test.group('Admin dashboard endpoint (core sections)', (group) => {
	group.each.setup(() => testUtils.db().truncate());

	test('GET /admin renders the identity and file sections', async ({ client, assert }) => {
		const user = await createAdminUser({
			email: 'core-dashboard@example.com',
			permissionSlugs: VIEW_PERMISSIONS,
		});

		const folder = await FileFolderFactory.merge({ name: 'core-dash-folder' }).create();
		await FileFactory.merge({ folderId: folder.id, originalName: 'core-dash-file.txt' }).create();

		const res = await client.get('/admin').loginAs(user);

		res.assertStatus(200);
		const page = parseInertiaPage(res.text());
		const stats = page.props.stats;

		assert.isAbove(stats.identity.users, 0);

		// The file section reports the seeded folder and its file.
		assert.isAtLeast(stats.file.fileFolders, 1);
		assert.isAtLeast(stats.file.files, 1);
		const folderEntry = stats.file.filesByFolder.find((f: { name: string }) => f.name === folder.name);
		assert.exists(folderEntry);
		assert.isAtLeast(folderEntry!.count, 1);
	});
});
