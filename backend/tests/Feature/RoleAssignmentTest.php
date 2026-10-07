<?php

namespace Tests\Feature;

use App\Models\BusinessGroup;
use App\Models\Role;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_hold_multiple_roles(): void
    {
        [$adminUser, $adminRole, $leaderRole, $staffRole, $group] = $this->fixture();
        $target = User::factory()->create();
        $token = $this->sessionToken($adminUser);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/admin/users/{$target->id}/assignments", [
                'role_ids' => [$leaderRole->id, $staffRole->id],
                'business_group_ids' => [$group->id],
            ])
            ->assertOk();

        $this->assertCount(2, $target->fresh()->roles);
    }

    public function test_team_leader_must_have_at_least_one_business_group(): void
    {
        [$adminUser, , $leaderRole] = $this->fixture();
        $target = User::factory()->create();
        $token = $this->sessionToken($adminUser);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/admin/users/{$target->id}/assignments", [
                'role_ids' => [$leaderRole->id],
                'business_group_ids' => [],
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Trưởng nhóm bắt buộc phải được gán ít nhất một nhóm kinh doanh.');
    }

    public function test_admin_cannot_remove_own_admin_role(): void
    {
        [$adminUser, , , $staffRole] = $this->fixture();
        $token = $this->sessionToken($adminUser);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson("/api/admin/users/{$adminUser->id}/assignments", [
                'role_ids' => [$staffRole->id],
                'business_group_ids' => [],
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Không thể tự thu hồi vai trò quản trị của chính mình.');
    }

    private function fixture(): array
    {
        $adminRole = Role::create(['name' => 'admin', 'display_name' => 'Quản trị hệ thống']);
        $leaderRole = Role::create(['name' => 'team_leader', 'display_name' => 'Trưởng nhóm']);
        $staffRole = Role::create(['name' => 'staff', 'display_name' => 'Nhân viên']);
        $group = BusinessGroup::create(['name' => 'Nhóm A']);
        $adminUser = User::factory()->create();
        $adminUser->roles()->attach($adminRole->id);

        return [$adminUser, $adminRole, $leaderRole, $staffRole, $group];
    }

    private function sessionToken(User $user): string
    {
        $token = str_repeat('a', 64);

        UserSession::create([
            'user_id' => $user->id,
            'token' => $token,
            'last_activity' => now(),
            'expires_at' => now()->addMinutes(30),
            'revoked' => false,
        ]);

        return $token;
    }
}
