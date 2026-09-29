import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import SlugExistsException from '#core/exceptions/slug_exists_exception';
import { UpdatePermissionAction } from '#identity/actions/permission/update_permission_action';
import SystemPermissionImmutableException from '#identity/exceptions/system_permission_immutable_exception';
import Permission from '#identity/models/permission';

test.group('UpdatePermissionAction', () => {
	test('execute() updates attributes', async ({ assert }) => {
		const action = await app.container.make(UpdatePermissionAction);
		const permission = await Permission.create({
			name: 'Spec Update Permission',
			slug: 'spec_update_permission',
			category: 'spec',
		});

		const updated = await action.execute({
			id: permission.id,
			name: 'Spec Update Permission Renamed',
			slug: 'spec_update_permission',
			category: 'spec_updated',
			description: 'Updated by spec',
		});

		assert.equal(updated.name, 'Spec Update Permission Renamed');
		assert.equal(updated.category, 'spec_updated');
		assert.equal(updated.description, 'Updated by spec');
	});

	test('execute() throws RowNotFoundException when permission does not exist', async ({ assert }) => {
		const action = await app.container.make(UpdatePermissionAction);

		await assert.rejects(
			() =>
				action.execute({
					id: 999999,
					name: 'X',
					slug: 'spec_update_permission_missing',
					category: 'spec',
					description: null,
				}),
			RowNotFoundException,
		);
	});

	test('execute() throws SystemPermissionImmutableException on system permission', async ({ assert }) => {
		const action = await app.container.make(UpdatePermissionAction);
		const permission = await Permission.create({
			name: 'Spec Update System Permission',
			slug: 'spec_update_system_permission',
			category: 'spec',
			isSystem: true,
		});

		await assert.rejects(
			() =>
				action.execute({
					id: permission.id,
					name: 'Renamed',
					slug: 'spec_update_system_permission',
					category: 'spec',
					description: null,
				}),
			SystemPermissionImmutableException,
		);
	});

	test('execute() throws SlugExistsException when new slug is already taken', async ({ assert }) => {
		const action = await app.container.make(UpdatePermissionAction);
		await Permission.create({
			name: 'Spec Update Perm Taken A',
			slug: 'spec_update_perm_taken_a',
			category: 'spec',
		});
		const permission = await Permission.create({
			name: 'Spec Update Perm Taken B',
			slug: 'spec_update_perm_taken_b',
			category: 'spec',
		});

		await assert.rejects(
			() =>
				action.execute({
					id: permission.id,
					name: 'Renamed',
					slug: 'spec_update_perm_taken_a',
					category: 'spec',
					description: null,
				}),
			SlugExistsException,
		);
	});
});
