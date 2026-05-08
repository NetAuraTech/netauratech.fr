import { RoleSchema } from '#database/schema'
import { hasMany, manyToMany } from '@adonisjs/lucid/orm'
import Permission from '#models/auth/permission'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/auth/user'

export default class Role extends RoleSchema {
  @manyToMany(() => Permission, {
    pivotTable: 'role_permission',
    pivotTimestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  })
  declare permissions: ManyToMany<typeof Permission>

  @hasMany(() => User)
  declare users: HasMany<typeof User>

  /**
   * Check if role has a specific permission
   */
  async hasPermission(permissionSlug: string): Promise<boolean> {
    await (this as Role).load('permissions')
    return this.permissions.some((p) => p.slug === permissionSlug)
  }

  /**
   * Check if role is admin
   */
  get isAdmin(): boolean {
    return this.slug === 'admin'
  }

  /**
   * Check if role can be deleted
   */
  get canBeDeleted(): boolean {
    return !this.isSystem
  }

  /**
   * Check if role can be modified
   */
  get canBeModified(): boolean {
    return !this.isSystem
  }

  /**
   * Assign permission to role
   */
  async assignPermission(permissionId: number): Promise<void> {
    await (this as Role).related('permissions').attach({ [permissionId]: {} })
  }

  /**
   * Remove permission from role
   */
  async removePermission(permissionId: number): Promise<void> {
    await (this as Role).related('permissions').detach([permissionId])
  }

  /**
   * Sync permissions (replace all)
   */
  async syncPermissions(permissionIds: number[]): Promise<void> {
    const pivotData: Record<number, Record<string, never>> = {}
    permissionIds.forEach((id) => {
      pivotData[id] = {}
    })

    await (this as Role).related('permissions').sync(pivotData, true)
  }
}
