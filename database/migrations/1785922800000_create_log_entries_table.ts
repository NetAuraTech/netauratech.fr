import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'log_entries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('level', 10).notNullable()
      table.string('category', 30).notNullable()
      table.text('message').notNullable()
      table
        .integer('actor_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('actor_email', 255).nullable()
      table.string('ip', 45).nullable()
      table.text('user_agent').nullable()
      table.string('request_id', 64).nullable()
      table.json('context').nullable()
      table.json('error').nullable()
      table.timestamp('created_at').notNullable()

      table.index(['level', 'created_at'])
      table.index(['category', 'created_at'])
      table.index(['actor_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
