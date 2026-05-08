import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'page_translations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('page_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('pages')
        .onDelete('CASCADE')
      table.string('locale', 10).notNullable()
      table.string('slug').notNullable()
      table.string('title').notNullable()
      table.string('meta_title').nullable()
      table.text('meta_description').nullable()
      table
        .json('content')
        .notNullable()
        .defaultTo(JSON.stringify({ blocks: [] }))
      table.enum('status', ['draft', 'published', 'archived']).notNullable().defaultTo('draft')
      table.timestamp('published_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['page_id', 'locale'])
      table.unique(['slug'])
      table.index(['slug', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
