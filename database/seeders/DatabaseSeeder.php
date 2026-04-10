<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Netauratech\CoreCms\Models\User;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'username' => 'Administrator',
            'email' => 'admin@example.com',
        ]);

        $packageSeeders = config('package-seeders', []);

        foreach ($packageSeeders as $seederInfo) {
            $seederClass = $seederInfo['class'];

            if (class_exists($seederClass)) {
                $this->command->info("Seeding from package: {$seederInfo['package']}");
                $this->call($seederClass);
            }
        }
    }
}
