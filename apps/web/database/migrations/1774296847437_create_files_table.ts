import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
	protected tableName = 'files';

	async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments('id');
			table.string('filename').notNullable();
			table.string('original_name').notNullable();
			table.string('mime_type').notNullable();
			table.string('extension', 20).notNullable();
			table.bigInteger('size').unsigned().notNullable().comment('Size in bytes');
			table.string('path').notNullable();
			table.enum('disk', ['fs', 'r2', 's3']).notNullable().defaultTo('fs');
			table.integer('folder_id').unsigned().nullable().references('id').inTable('file_folders').onDelete('SET NULL');
			table.integer('uploaded_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
			table.timestamp('created_at').notNullable();
			table.timestamp('updated_at').nullable();
		});
	}

	async down() {
		this.schema.dropTable(this.tableName);
	}
}
