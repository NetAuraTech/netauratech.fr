import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/auth/role'
import Permission from '#models/auth/permission'

export default class extends BaseSeeder {
  async run() {
    const rolesData = {
      admin: { isSystem: true },
      user: { isSystem: true },
    }

    const roles = Object.entries(rolesData).map(([slug, meta]) => ({
      name: `roles.${slug}.value`,
      slug,
      description: `roles.${slug}.description`,
      isSystem: meta.isSystem,
    }))

    const createdRoles = await Promise.all(
      roles.map((role) => Role.updateOrCreate({ slug: role.slug }, role))
    )

    const roleMap = Object.fromEntries(createdRoles.map((r) => [r.slug, r]))

    const permissions = await Permission.all()

    const ids = permissions.map((p) => p.id)

    await roleMap['admin'].syncPermissions(ids)
    await roleMap['user'].syncPermissions([])

    await Promise.all(createdRoles.map((role) => role.load('permissions')))

    console.log('✅ Roles seeded successfully')
    console.log(`  - Created ${createdRoles.length} role(s):`)

    Object.entries(roleMap).forEach(([slug, role]) => {
      console.log(`  - Role "${slug}": permissions: ${role.permissions.length}`)
    })
  }
}
