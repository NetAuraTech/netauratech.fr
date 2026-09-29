import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
	protected tableName = 'file_alts';

	async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments('id');
			table.integer('file_id').unsigned().notNullable().references('id').inTable('files').onDelete('CASCADE');
			table.string('locale', 10).notNullable();
			table.string('key', 100).notNullable().comment('Named key, e.g. "hero", "thumbnail"');
			table.text('value').notNullable().comment('Alt text value for this locale and key');
			table.timestamp('created_at').notNullable();
			table.timestamp('updated_at').nullable();

			table.unique(['file_id', 'locale', 'key']);
			table.index(['file_id', 'locale']);
		});
	}

	async down() {
		this.schema.dropTable(this.tableName);
	}
}
