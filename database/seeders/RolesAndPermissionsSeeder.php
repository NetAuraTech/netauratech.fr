<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Netauratech\CoreCms\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::find(1);

        $permissions = [
            'access-administration',
            'role-list',
            'role-create',
            'role-edit',
            'role-delete',
            'content-list',
            'content-create',
            'content-edit',
            'content-delete',
            'user-list',
            'user-create',
            'user-edit',
            'user-delete',
            'category-list',
            'category-create',
            'category-edit',
            'category-delete',
            'tag-list',
            'tag-create',
            'tag-edit',
            'tag-delete',
            'option-list',
            'option-edit',
            'option-create',
            'option-delete',
            'theme-list',
            'theme-upload',
            'theme-delete',
            'extension-list',
            'extension-upload',
            'extension-toggle',
            'extension-delete',
            'media-list',
            'media-upload',
            'media-delete',
            'spam-detect',
            'spam-put',
            'spam-remove',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $role = Role::firstOrCreate(['name' => 'Super Administrator']);
        $role->givePermissionTo(Permission::all());

        $user->assignRole($role);
    }
}
