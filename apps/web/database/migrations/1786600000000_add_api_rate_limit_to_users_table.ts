import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
	protected tableName = 'users';

	async up() {
		this.schema.alterTable(this.tableName, (table) => {
			table.integer('api_rate_limit').unsigned().nullable();
		});
	}

	async down() {
		this.schema.alterTable(this.tableName, (table) => {
			table.dropColumn('api_rate_limit');
		});
	}
}
