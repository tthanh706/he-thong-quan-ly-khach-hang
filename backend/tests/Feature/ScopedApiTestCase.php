<?php

namespace Tests\Feature;

use App\Enums\DataScope;
use App\Enums\Role;
use App\Models\Activity;
use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\Quote;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

abstract class ScopedApiTestCase extends TestCase
{
    use RefreshDatabase;

    protected Team $team1;

    protected Team $team2;

    /** U1 va U2 cung thuoc team1 nhung KHONG thay du lieu cua nhau */
    protected User $u1;

    protected User $u2;

    protected User $lead1;

    protected User $u4;

    protected User $director;

    protected function setUp(): void
    {
        parent::setUp();

        $this->team1 = Team::factory()->create(['name' => 'Nhom 1']);
        $this->team2 = Team::factory()->create(['name' => 'Nhom 2']);

        $this->u1 = User::factory()->create(['team_id' => $this->team1->id, 'role' => Role::EMPLOYEE]);
        $this->u2 = User::factory()->create(['team_id' => $this->team1->id, 'role' => Role::EMPLOYEE]);
        $this->lead1 = User::factory()->teamLead()->create(['team_id' => $this->team1->id]);
        $this->u4 = User::factory()->create(['team_id' => $this->team2->id, 'role' => Role::EMPLOYEE]);
        $this->director = User::factory()->director()->create(['team_id' => $this->team2->id]);
    }

    protected function customerOwnedBy(User $owner, string $code = 'KH-001'): Customer
    {
        return Customer::factory()->create([
            'owner_id' => $owner->id,
            'team_id' => $owner->team_id,
            'code' => $code,
        ]);
    }

    protected function opportunityOwnedBy(User $owner, string $code = 'CO-001'): Opportunity
    {
        return Opportunity::factory()->create([
            'owner_id' => $owner->id,
            'team_id' => $owner->team_id,
            'code' => $code,
        ]);
    }

    protected function activityOwnedBy(User $owner, string $title = 'Cuoc goi'): Activity
    {
        return Activity::factory()->create([
            'owner_id' => $owner->id,
            'team_id' => $owner->team_id,
            'title' => $title,
        ]);
    }

    protected function quoteOwnedBy(User $owner, string $code = 'BG-2026-001', ?Customer $customer = null): Quote
    {
        return Quote::factory()->create(array_filter([
            'owner_id' => $owner->id,
            'team_id' => $owner->team_id,
            'code' => $code,
            'customer_id' => $customer?->id,
        ], static fn (mixed $value): bool => $value !== null));
    }

    /** Token cua nguoi dung, kem pham vi mong muon. */
    protected function tokenFor(User $user, ?DataScope $scope = null): array
    {
        return [
            'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
            'X-Data-Scope' => $scope?->value ?? 'auto',
        ];
    }
}
