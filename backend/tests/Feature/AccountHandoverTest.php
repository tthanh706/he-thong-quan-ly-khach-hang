<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountHandoverTest extends TestCase
{
    use RefreshDatabase;

    private function makeSession(User $user): UserSession
    {
        return UserSession::create([
            'user_id' => $user->id,
            'token' => hash('sha256', uniqid((string) $user->id, true)),
            'last_activity' => now(),
            'expires_at' => now()->addMinutes(30),
            'revoked' => false,
        ]);
    }

    public function test_admin_can_lock_account_handover_data_and_revoke_sessions(): void
    {
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => Hash::make('password'), 'role' => 'admin']);
        $source = User::create(['name' => 'Source', 'email' => 'source@example.com', 'password' => Hash::make('password'), 'role' => 'staff']);
        $target = User::create(['name' => 'Target', 'email' => 'target@example.com', 'password' => Hash::make('password'), 'role' => 'staff']);

        Customer::create(['name' => 'C1', 'owner_id' => $source->id]);
        Opportunity::create(['title' => 'O1', 'amount' => 100, 'owner_id' => $source->id]);

        $adminSession = $this->makeSession($admin);
        $sourceSession1 = $this->makeSession($source);
        $sourceSession2 = $this->makeSession($source);

        $response = $this->withHeader('Authorization', 'Bearer '.$adminSession->token)
            ->postJson("/api/accounts/{$source->id}/lock", [
                'replacement_user_id' => $target->id,
            ]);

        $response->assertOk();
        $this->assertNotNull(User::find($source->id)->locked_at);
        $this->assertDatabaseHas('customers', ['owner_id' => $target->id]);
        $this->assertDatabaseHas('opportunities', ['owner_id' => $target->id]);
        $this->assertDatabaseCount('handover_logs', 2);
        $this->assertDatabaseHas('handover_logs', ['performed_by_user_id' => $admin->id]);
        $this->assertTrue($sourceSession1->fresh()->revoked);
        $this->assertTrue($sourceSession2->fresh()->revoked);
    }

    public function test_non_admin_cannot_lock_account(): void
    {
        $staff = User::create(['name' => 'Staff', 'email' => 'staff@example.com', 'password' => Hash::make('password'), 'role' => 'staff']);
        $source = User::create(['name' => 'Source', 'email' => 'source@example.com', 'password' => Hash::make('password'), 'role' => 'staff']);
        $target = User::create(['name' => 'Target', 'email' => 'target@example.com', 'password' => Hash::make('password'), 'role' => 'staff']);
        $staffSession = $this->makeSession($staff);

        $this->withHeader('Authorization', 'Bearer '.$staffSession->token)
            ->postJson("/api/accounts/{$source->id}/lock", ['replacement_user_id' => $target->id])
            ->assertStatus(403)
            ->assertJson(['message' => 'Bạn không có quyền khóa tài khoản người dùng.']);
    }

    public function test_locked_user_cannot_login(): void
    {
        $user = User::create([
            'name' => 'Locked',
            'email' => 'locked@example.com',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'locked_at' => now(),
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(423);
    }
}
