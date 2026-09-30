<?php

namespace Database\Factories;

use App\Enums\OpportunityStage;
use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Opportunity>
 */
class OpportunityFactory extends Factory
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
            'code' => 'CO-'.fake()->unique()->numerify('###'),
            'title' => fake()->sentence(4),
            'amount' => fake()->numberBetween(50_000_000, 2_000_000_000),
            'stage' => OpportunityStage::PROSPECTING,
            'close_date' => now()->addMonths(2)->toDateString(),
        ];
    }
}
