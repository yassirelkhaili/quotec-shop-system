<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Test logins (password: "password"). Customer numbers K-10001 / K-10002
        // are assigned automatically when the users are created (AppServiceProvider).
        User::factory()->create(['name' => 'Test User', 'email' => 'test@example.com']);
        User::factory()->create(['name' => 'Anna Schmidt', 'email' => 'anna@example.com']);

        $this->call(ShopSeeder::class);
    }
}
