import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Permission from '#models/auth/permission'

export default class extends BaseSeeder {
  async run() {
    const categories = {
      admin: ['access'],
      users: ['view', 'create', 'update', 'delete', 'manage_roles'],
      roles: ['view', 'create', 'update', 'delete', 'manage_permissions'],
      permissions: ['view', 'create', 'update', 'delete'],
      pages: ['view', 'create', 'update', 'delete', 'publish'],
      templates: ['manage'],
      files: ['view', 'upload', 'delete'],
    }

    const permissions = Object.entries(categories).flatMap(([category, actions]) =>
      actions.map((action) => ({
        name: `permissions:${category}.${action}.value`,
        slug: `${category}.${action}`,
        category: `permissions:category.${category}`,
        description: `permissions:${category}.${action}.description`,
        isSystem: true,
      }))
    )

    const createdPermissions = await Promise.all(
      permissions.map((permission) => {
        Permission.updateOrCreate({ slug: permission.slug }, permission)
      })
    )

    console.log('✅ Permissions seeded successfully')
    console.log(`  - Created ${createdPermissions.length} permissions`)
  }
}
