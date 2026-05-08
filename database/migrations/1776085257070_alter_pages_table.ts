import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pages'

  async up() {
    // 1. Create the column
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_homepage').notNullable().defaultTo(false)
    })

    this.schema.raw(
      `CREATE UNIQUE INDEX pages_unique_homepage
       ON ${this.tableName} (is_homepage)
       WHERE is_homepage = true`
    )
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex([], 'pages_unique_homepage') // Drop index first
      table.dropColumn('is_homepage')
    })
  }
}
