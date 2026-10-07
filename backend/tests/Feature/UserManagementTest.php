<?php
namespace Tests\Feature;

use App\Mail\UserActivationMail;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function adminToken(): string
    {
        $admin = User::factory()->create(['role'=>'admin','status'=>'active']);
        $token = hash('sha256', 'test-admin-token');
        UserSession::create([
            'user_id'=>$admin->id,
            'token'=>$token,
            'last_activity'=>now(),
            'expires_at'=>now()->addMinutes(30),
            'revoked'=>false,
        ]);
        return $token;
    }

    public function test_admin_can_create_user_and_activation_email_is_sent(): void
    {
        Mail::fake();
        $token = $this->adminToken();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/users', [
                'name'=>'Nhân viên mới',
                'email'=>'new@company.com',
                'business_group'=>'Nhóm Miền Bắc',
                'role'=>'sales',
            ]);

        $response->assertCreated()->assertJsonPath('user.status', 'pending');
        $this->assertDatabaseHas('users', ['email'=>'new@company.com','status'=>'pending']);
        Mail::assertSent(UserActivationMail::class, fn ($mail) => $mail->hasTo('new@company.com'));
    }

    public function test_duplicate_email_is_rejected_with_clear_vietnamese_message(): void
    {
        User::factory()->create(['email'=>'used@company.com']);
        $token = $this->adminToken();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/users', [
                'name'=>'A',
                'email'=>'used@company.com',
                'role'=>'sales',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonFragment(['Email này đã tồn tại trong hệ thống.']);
    }

    public function test_user_list_is_paginated_20_and_can_search_by_group(): void
    {
        $token = $this->adminToken();
        User::factory()->count(24)->create(['business_group'=>'Nhóm Khác']);
        User::factory()->count(3)->create(['business_group'=>'Miền Bắc Đặc Biệt']);

        $page = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/users');
        $page->assertOk()->assertJsonPath('meta.per_page', 20);
        $this->assertCount(20, $page->json('data'));

        $search = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/users?search=Đặc%20Biệt');
        $search->assertOk()->assertJsonPath('meta.total', 3);
    }
}
