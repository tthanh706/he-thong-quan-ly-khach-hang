<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * S2-02: Xem và cập nhật hồ sơ cá nhân (Profile & Chữ ký Email).
 */
class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private const PROFILE_URL = '/api/v1/profile';

    private function makeUser(string $email = 'an@company.com'): User
    {
        return User::create(['name' => 'Nguyễn Văn An', 'email' => $email, 'password' => Hash::make('password'), 'role' => 'staff']);
    }

    private function tokenFor(User $user): string
    {
        return UserSession::create([
            'user_id' => $user->id,
            'token' => hash('sha256', uniqid((string) $user->id, true)),
            'last_activity' => now(),
            'expires_at' => now()->addMinutes(30),
            'revoked' => false,
        ])->token;
    }

    public function test_user_can_view_own_profile(): void
    {
        $user = $this->makeUser();

        $this->withToken($this->tokenFor($user))
            ->getJson(self::PROFILE_URL)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', 'an@company.com')
            ->assertJsonPath('data.role_label', 'Nhân viên kinh doanh')
            ->assertJsonMissingPath('data.password');
    }

    public function test_user_can_update_profile_and_email_signature(): void
    {
        $user = $this->makeUser();

        $this->withToken($this->tokenFor($user))
            ->patchJson(self::PROFILE_URL, [
                'name' => 'Nguyễn Văn An (Sales)',
                'phone' => '0912345678',
                'job_title' => 'Chuyên viên kinh doanh',
                'email_signature' => "Trân trọng,   \r\nNguyễn Văn An\r\n0912 345 678\r\n",
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Cập nhật hồ sơ thành công.')
            ->assertJsonPath('data.job_title', 'Chuyên viên kinh doanh')
            ->assertJsonPath('data.email_signature', "Trân trọng,\nNguyễn Văn An\n0912 345 678");

        $this->assertDatabaseHas('users', ['id' => $user->id, 'phone' => '0912345678', 'name' => 'Nguyễn Văn An (Sales)']);
    }

    public function test_partial_update_keeps_other_fields(): void
    {
        $user = $this->makeUser();
        $user->update(['job_title' => 'Trưởng nhóm']);

        $this->withToken($this->tokenFor($user))
            ->patchJson(self::PROFILE_URL, ['email_signature' => 'Thân mến'])
            ->assertOk()
            ->assertJsonPath('data.job_title', 'Trưởng nhóm')
            ->assertJsonPath('data.email_signature', 'Thân mến');
    }

    public function test_profile_update_validates_input(): void
    {
        $user = $this->makeUser();

        $this->withToken($this->tokenFor($user))
            ->patchJson(self::PROFILE_URL, [
                'name' => '',
                'phone' => '12345',
                'email_signature' => str_repeat('a', 2001),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'phone', 'email_signature']);
    }

    public function test_user_cannot_change_email_or_role(): void
    {
        $user = $this->makeUser();

        $this->withToken($this->tokenFor($user))
            ->patchJson(self::PROFILE_URL, ['email' => 'hacker@company.com', 'role' => 'admin'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'role']);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'email' => 'an@company.com', 'role' => 'staff']);
    }

    public function test_user_only_updates_own_profile(): void
    {
        $userA = $this->makeUser('a@company.com');
        $userB = $this->makeUser('b@company.com');

        $this->withToken($this->tokenFor($userA))
            ->patchJson(self::PROFILE_URL, ['id' => $userB->id, 'name' => 'Đã bị sửa'])
            ->assertOk()
            ->assertJsonPath('data.id', $userA->id);

        $this->assertDatabaseHas('users', ['id' => $userB->id, 'name' => 'Nguyễn Văn An']);
    }

    public function test_guest_cannot_access_profile(): void
    {
        $this->getJson(self::PROFILE_URL)->assertUnauthorized();
        $this->patchJson(self::PROFILE_URL, ['name' => 'X'])->assertUnauthorized();
    }
}
