<?php

namespace Tests\Feature;

use App\Enums\DataScope;
use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ScopeEscalationTest extends ScopedApiTestCase
{
    public function test_nhan_vien_yeu_cau_pham_vi_team_bi_ha_ve_own(): void
    {
        $this->customerOwnedBy($this->u2, 'KH-U2');

        $response = $this->getJson('/api/customers', $this->tokenFor($this->u1, DataScope::TEAM));

        $response->assertOk()
            ->assertJsonPath('meta.scope', 'own')
            ->assertJsonCount(0, 'data');
    }

    public function test_nhan_vien_yeu_cau_pham_vi_all_bi_ha_ve_own(): void
    {
        $this->customerOwnedBy($this->u2, 'KH-U2');

        $response = $this->getJson('/api/customers', $this->tokenFor($this->u1, DataScope::ALL));

        $response->assertOk()
            ->assertJsonPath('meta.scope', 'own')
            ->assertJsonCount(0, 'data');
    }

    public function test_truong_nhom_yeu_cau_all_bi_ha_ve_team(): void
    {
        $response = $this->getJson('/api/customers', $this->tokenFor($this->lead1, DataScope::ALL));

        $response->assertOk()
            ->assertJsonPath('meta.scope', 'team');
    }

    public function test_giam_doc_duoc_chon_ca_ba_pham_vi(): void
    {
        $response = $this->getJson('/api/customers', $this->tokenFor($this->director, DataScope::OWN));
        $response->assertOk()->assertJsonPath('meta.scope', 'own');

        $response = $this->getJson('/api/customers', $this->tokenFor($this->director, DataScope::TEAM));
        $response->assertOk()->assertJsonPath('meta.scope', 'team');

        $response = $this->getJson('/api/customers', $this->tokenFor($this->director, DataScope::ALL));
        $response->assertOk()->assertJsonPath('meta.scope', 'all');
    }

    public function test_pham_vi_mac_dinh_khi_khong_gui_header(): void
    {
        $user = User::factory()->teamLead()->create();
        $headers = ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];

        $this->getJson('/api/customers', $headers)
            ->assertOk()
            ->assertJsonPath('meta.scope', 'team');
    }

    public function test_login_voi_pham_vi_vuot_quyen_bi_ha_ve_mac_dinh(): void
    {
        $user = User::factory()->create(['password' => bcrypt('12345678'), 'role' => Role::EMPLOYEE]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => '12345678',
            'scope' => 'all',
        ])->assertOk()->assertJsonPath('scope.value', 'own');
    }
}
