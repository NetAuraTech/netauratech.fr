import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'page_revisions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('page_translation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('page_translations')
        .onDelete('CASCADE')
      table.json('content').notNullable()
      table
        .boolean('keep')
        .notNullable()
        .defaultTo(false)
        .comment('Pinned revisions are never auto-purged')
      table
        .integer('created_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at').notNullable()

      table.index(['page_translation_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
