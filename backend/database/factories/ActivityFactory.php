<?php

namespace Database\Factories;

use App\Enums\ActivityStatus;
use App\Enums\ActivityType;
use App\Models\Activity;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Activity>
 */
class ActivityFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'team_id' => fn (array $attributes) => User::find($attributes['owner_id'])?->team_id,
            'customer_id' => Customer::factory(),
            'assignee_id' => null,
            'title' => fake()->sentence(4),
            'type' => ActivityType::CALL,
            'due_at' => now()->addDays(3),
            'status' => ActivityStatus::TODO,
        ];
    }
}
