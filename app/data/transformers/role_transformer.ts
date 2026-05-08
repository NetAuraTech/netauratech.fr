import { BaseTransformer } from '@adonisjs/core/transformers'
import type Role from '#models/auth/role'
import PermissionTransformer from '#transformers/permission_transformer'

export default class RoleTransformer extends BaseTransformer<Role> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'slug', 'description', 'createdAt', 'updatedAt']),
      permissions: PermissionTransformer.transform(this.whenLoaded(this.resource.permissions)),
    }
  }
}
