import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'templates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description').nullable()
      table
        .integer('thumbnail_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('files')
        .onDelete('SET NULL')
      table.enum('type', ['page', 'block']).notNullable()
      table
        .string('block_type', 50)
        .nullable()
        .comment('Populated only when type = block, e.g. "hero"')
      table.json('content').notNullable()
      table
        .integer('created_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['type', 'block_type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
