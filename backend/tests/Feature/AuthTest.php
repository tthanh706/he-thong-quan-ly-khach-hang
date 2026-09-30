<?php

namespace Tests\Feature;

use App\Enums\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_dang_nhap_thanh_cong_tra_token_va_thong_tin_phan_quyen(): void
    {
        $user = \App\Models\User::factory()->create([
            'email' => 'minhanh@crm.vn',
            'password' => bcrypt('12345678'),
            'role' => Role::EMPLOYEE,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'minhanh@crm.vn',
            'password' => '12345678',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'minhanh@crm.vn')
            ->assertJsonPath('permissions.role', 'employee')
            ->assertJsonPath('permissions.default_scope', 'own')
            ->assertJsonPath('permissions.permissions.delete', false)
            ->assertJsonPath('scope.value', 'own');

        $this->assertNotEmpty($response->json('token'));
        $this->assertSame(1, $user->tokens()->count());
    }

    public function test_dang_nhap_sai_mat_khau_bi_tu_choi(): void
    {
        \App\Models\User::factory()->create([
            'email' => 'thuha@crm.vn',
            'password' => bcrypt('12345678'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'thuha@crm.vn',
            'password' => 'sai-mat-khau',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_api_can_ban_yeu_cau_token(): void
    {
        $this->getJson('/api/customers')->assertUnauthorized();
    }

    public function test_me_tra_ve_pham_vi_mac_dinh_cua_vai_tro(): void
    {
        $director = \App\Models\User::factory()->director()->create();

        $response = $this->getJson('/api/me', [
            'Authorization' => 'Bearer '.$director->createToken('test')->plainTextToken,
        ]);

        $response->assertOk()
            ->assertJsonPath('permissions.default_scope', 'all')
            ->assertJsonPath('permissions.permissions.delete', true);
    }

    public function test_logout_xoa_token(): void
    {
        $user = \App\Models\User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->postJson('/api/logout', [], ['Authorization' => 'Bearer '.$token])
            ->assertOk()
            ->assertJsonPath('message', 'Đã đăng xuất.');

        $this->assertSame(0, $user->tokens()->count());
    }
}
