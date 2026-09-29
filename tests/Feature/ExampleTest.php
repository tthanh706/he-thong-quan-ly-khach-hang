<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_lock_user_and_transfer_all_data(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin Test',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $employee = User::factory()->create([
            'name' => 'Employee Test',
            'email' => 'employee@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'is_active' => true,
        ]);

        $successor = User::factory()->create([
            'name' => 'Successor Test',
            'email' => 'successor@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'is_active' => true,
        ]);

        $customer = Customer::create([
            'name' => 'Customer Test',
            'email' => 'customer@test.com',
            'phone' => '0123456789',
            'owner_id' => $employee->id,
        ]);

        $opportunity = Opportunity::create([
            'name' => 'Opportunity Test',
            'description' => 'Test opportunity',
            'amount' => 1000000,
            'status' => 'open',
            'owner_id' => $employee->id,
        ]);

        $this->actingAs($admin);

        $response = $this->postJson(
            "/api/users/{$employee->id}/lock",
            [
                'transfer_to_user_id' => $successor->id,
            ]
        );

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Khóa tài khoản và bàn giao dữ liệu thành công.',
                'data' => [
                    'target_user_id' => $employee->id,
                    'transfer_to_user_id' => $successor->id,
                    'customers_transferred' => 1,
                    'opportunities_transferred' => 1,
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $employee->id,
            'is_active' => 0,
        ]);

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'owner_id' => $successor->id,
        ]);

        $this->assertDatabaseHas('opportunities', [
            'id' => $opportunity->id,
            'owner_id' => $successor->id,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'actor_id' => $admin->id,
            'target_user_id' => $employee->id,
            'transfer_to_user_id' => $successor->id,
            'action' => 'lock_and_handover',
        ]);
    }

    public function test_locked_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'email' => 'locked@test.com',
            'password' => Hash::make('password'),
            'is_active' => false,
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors([
            'email' => 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
        ]);
    }
}