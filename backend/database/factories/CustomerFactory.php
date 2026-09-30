<?php

namespace Database\Factories;

use App\Enums\CustomerStatus;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'team_id' => fn (array $attributes) => User::find($attributes['owner_id'])?->team_id,
            'code' => 'KH-'.fake()->unique()->numerify('###'),
            'name' => fake()->company(),
            'industry' => fake()->randomElement(['San xuat', 'Ban le', 'Tai chinh', 'Xay dung']),
            'city' => fake()->city(),
            'phone' => fake()->numerify('024 #### ####'),
            'email' => fake()->unique()->companyEmail(),
            'status' => CustomerStatus::LEAD,
        ];
    }
}
