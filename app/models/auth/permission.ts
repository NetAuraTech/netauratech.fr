import { PermissionSchema } from '#database/schema'
import { manyToMany } from '@adonisjs/lucid/orm'
import Role from '#models/auth/role'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Permission extends PermissionSchema {
  @manyToMany(() => Role, {
    pivotTable: 'role_permission',
    pivotTimestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  })
  declare roles: ManyToMany<typeof Role>

  /**
   * Check if permission can be deleted
   */
  get canBeDeleted(): boolean {
    return !this.isSystem
  }

  /**
   * Check if permission can be modified
   */
  get canBeModified(): boolean {
    return !this.isSystem
  }
}
