<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password = null;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'title' => 'Nhan vien kinh doanh',
            'role' => Role::EMPLOYEE,
            'avatar_color' => '#2563eb',
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => \Illuminate\Support\Str::random(10),
        ];
    }

    public function teamLead(): static
    {
        return $this->state(fn (): array => ['role' => Role::TEAM_LEAD, 'title' => 'Truong nhom']);
    }

    public function director(): static
    {
        return $this->state(fn (): array => ['role' => Role::DIRECTOR, 'title' => 'Giam doc kinh doanh']);
    }
}
