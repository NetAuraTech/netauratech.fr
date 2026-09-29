import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
	protected tableName = 'users';

	async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments('id').notNullable();
			table.string('username').notNullable().unique();
			table.string('email', 254).notNullable().unique();
			table.string('password').nullable();

			table.timestamp('email_verified_at').nullable();
			table.string('pending_email').nullable();

			table.string('github_id').nullable().unique();
			table.string('google_id').nullable().unique();
			table.string('facebook_id').nullable().unique();

			table.timestamp('created_at').notNullable();
			table.timestamp('updated_at').nullable();
		});
	}

	async down() {
		this.schema.dropTable(this.tableName);
	}
}
