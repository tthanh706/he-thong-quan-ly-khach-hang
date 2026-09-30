<?php

namespace Database\Factories;

use App\Enums\QuoteStatus;
use App\Models\Customer;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quote>
 */
class QuoteFactory extends Factory
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
            'opportunity_id' => null,
            'code' => 'BG-'.fake()->unique()->numerify('2026-###'),
            'amount' => fake()->numberBetween(50_000_000, 2_000_000_000),
            'valid_until' => now()->addMonth()->toDateString(),
            'status' => QuoteStatus::DRAFT,
        ];
    }
}
