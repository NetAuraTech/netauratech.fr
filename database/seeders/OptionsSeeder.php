<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Netauratech\CoreCms\Models\Option;
use Netauratech\CoreCms\Models\User;

class OptionsSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (!Schema::hasTable('options')) {
            return;
        }

        Option::firstOrCreate(
            ['key' => 'site_name'],
            [
                'value' => 'Mon site',
                'category' => 'general',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'description'],
            [
                'value' => 'La description de mon site',
                'category' => 'general',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'logo'],
            [
                'value' => '',
                'category' => 'branding',
                'type' => 'media',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'favicon'],
            [
                'value' => '',
                'category' => 'branding',
                'type' => 'media',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'theme'],
            [
                'value' => 'default',
                'category' => 'theme',
                'type' => 'theme',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'contact-email'],
            [
                'value' => '',
                'category' => 'contact_emails',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'noreply-email'],
            [
                'value' => '',
                'category' => 'contact_emails',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'sav-email'],
            [
                'value' => '',
                'category' => 'contact_emails',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'spam_words'],
            [
                'value' => '',
                'category' => 'security',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'facebook'],
            [
                'value' => '',
                'category' => 'social_media',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'instagram'],
            [
                'value' => '',
                'category' => 'social_media',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'linkedin'],
            [
                'value' => '',
                'category' => 'social_media',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'twitter'],
            [
                'value' => '',
                'category' => 'social_media',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'youtube'],
            [
                'value' => '',
                'category' => 'social_media',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'host-name'],
            [
                'value' => 'o2Switch',
                'category' => 'legals',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'host-address'],
            [
                'value' => 'o2switch, Chemin des Pardiaux, 63000, Clermont-Ferrand, France',
                'category' => 'legals',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'host-phone'],
            [
                'value' => '04 44 44 60 40',
                'category' => 'legals',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'host-website'],
            [
                'value' => 'https://www.o2switch.fr',
                'category' => 'legals',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'phone'],
            [
                'value' => '',
                'category' => 'seo',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'address'],
            [
                'value' => '',
                'category' => 'seo',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'address_city'],
            [
                'value' => '',
                'category' => 'seo',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'address_postal-code'],
            [
                'value' => '',
                'category' => 'seo',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'address_region'],
            [
                'value' => '',
                'category' => 'seo',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'address_country'],
            [
                'value' => '',
                'category' => 'seo',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'address_longitude'],
            [
                'value' => '',
                'category' => 'seo',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'address_latitude'],
            [
                'value' => '',
                'category' => 'seo',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'area_served'],
            [
                'value' => '',
                'category' => 'seo',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'schedule_monday'],
            [
                'value' => '',
                'category' => 'schedule',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'schedule_tuesday'],
            [
                'value' => '',
                'category' => 'schedule',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'schedule_wednesday'],
            [
                'value' => '',
                'category' => 'schedule',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'schedule_thursday'],
            [
                'value' => '',
                'category' => 'schedule',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'schedule_friday'],
            [
                'value' => '',
                'category' => 'schedule',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'schedule_saturday'],
            [
                'value' => '',
                'category' => 'schedule',
                'type' => 'text',
            ]
        );

        Option::firstOrCreate(
            ['key' => 'schedule_sunday'],
            [
                'value' => '',
                'category' => 'schedule',
                'type' => 'text',
            ]
        );
    }
}
