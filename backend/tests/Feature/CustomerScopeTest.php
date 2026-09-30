<?php

namespace Tests\Feature;

use App\Enums\DataScope;
use App\Models\Customer;

class CustomerScopeTest extends ScopedApiTestCase
{
    public function test_pham_vi_cua_toi_chi_thay_ban_ghi_cua_bao_va_khong_thay_ban_ghi_dong_nghiep(): void
    {
        $mine = $this->customerOwnedBy($this->u1, 'KH-MINH');
        $this->customerOwnedBy($this->u2, 'KH-HA');   // cung nhom T1
        $this->customerOwnedBy($this->u4, 'KH-DUNG'); // nhom T2

        $response = $this->getJson('/api/customers', $this->tokenFor($this->u1));

        $response->assertOk()
            ->assertJsonPath('meta.scope', 'own')
            ->assertJsonPath('meta.total_visible', 1)
            ->assertJsonPath('meta.total_all', 3)
            ->assertJsonPath('meta.hidden_count', 2)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id);
    }

    public function test_pham_vi_cua_nhom_thay_du_lieu_ca_nhom(): void
    {
        $this->customerOwnedBy($this->u1, 'KH-MINH');
        $this->customerOwnedBy($this->u2, 'KH-HA');
        $this->customerOwnedBy($this->lead1, 'KH-BAO');
        $this->customerOwnedBy($this->u4, 'KH-DUNG');

        $response = $this->getJson('/api/customers', $this->tokenFor($this->lead1, DataScope::TEAM));

        $response->assertOk()
            ->assertJsonPath('meta.scope', 'team')
            ->assertJsonPath('meta.total_visible', 3)
            ->assertJsonPath('meta.hidden_count', 1)
            ->assertJsonCount(3, 'data');
    }

    public function test_pham_vi_toan_bo_thay_moi_ban_ghi(): void
    {
        $this->customerOwnedBy($this->u1, 'KH-MINH');
        $this->customerOwnedBy($this->u2, 'KH-HA');
        $this->customerOwnedBy($this->u4, 'KH-DUNG');

        $response = $this->getJson('/api/customers', $this->tokenFor($this->director, DataScope::ALL));

        $response->assertOk()
            ->assertJsonPath('meta.total_visible', 3)
            ->assertJsonPath('meta.hidden_count', 0)
            ->assertJsonCount(3, 'data');
    }

    public function test_xem_chi_tiet_ban_ghi_ngoai_pham_vi_bi_403_bang_thong_diep_tieng_viet(): void
    {
        $other = $this->customerOwnedBy($this->u2, 'KH-HA');

        $response = $this->getJson('/api/customers/'.$other->id, $this->tokenFor($this->u1))
            ->assertStatus(403)
            ->assertJsonPath('error', 'AccessDeniedError')
            ->assertJsonPath('entity', 'customer')
            ->assertJsonPath('scope', 'own')
            ->assertJsonPath('scope_label', 'Dữ liệu của tôi')
            ->assertJsonStructure(['message', 'error', 'entity', 'record_id', 'scope', 'action']);

        $message = $response->json('message');

        // Thong diep phai la tieng Viet co dau va noi ro ai so huu ban ghi.
        foreach ([
            'Không có quyền thực hiện',
            'xem khách hàng',
            'Dữ liệu của tôi',
            $this->u2->name,
            'Giám đốc kinh doanh',
        ] as $fragment) {
            $this->assertStringContainsString($fragment, $message);
        }

        $this->assertStringNotContainsString('Khong co quyen', $message);
        $this->assertStringNotContainsString('Du lieu cua toi', $message);
    }

    public function test_tao_moi_ban_ghi_luon_thuoc_ve_nguoi_dang_dang_nhap(): void
    {
        $response = $this->postJson('/api/customers', [
            'code' => 'KH-NEW',
            'name' => 'Cong ty moi',
            'status' => 'lead',
        ], $this->tokenFor($this->u1));

        $response->assertCreated()
            ->assertJsonPath('data.owner_id', $this->u1->id)
            ->assertJsonPath('data.team_id', $this->team1->id);

        $this->assertDatabaseHas('customers', [
            'code' => 'KH-NEW',
            'owner_id' => $this->u1->id,
            'team_id' => $this->team1->id,
        ]);
    }

    public function test_tao_moi_vao_ban_ghi_duoc_doi_don_ghep(): void
    {
        $other = $this->customerOwnedBy($this->u1, 'KH-MINH');

        $this->postJson('/api/customers', [
            'code' => 'KH-NEW',
            'name' => 'Cong ty moi',
            'status' => 'lead',
            'owner_id' => $this->u2->id,
            'team_id' => $this->team2->id,
        ], $this->tokenFor($this->u1))->assertCreated()
            ->assertJsonPath('data.owner_id', $this->u1->id)
            ->assertJsonPath('data.team_id', $this->team1->id);

        $this->assertSame((int) $this->u1->id, (int) $other->owner_id);
    }

    public function test_sua_ban_ghi_ngoai_pham_vi_bi_chan(): void
    {
        $other = $this->customerOwnedBy($this->u2, 'KH-HA');

        $this->putJson('/api/customers/'.$other->id, ['name' => 'Ten moi'], $this->tokenFor($this->u1))
            ->assertStatus(403);

        $this->assertSame('KH-HA', $other->fresh()->code);
    }

    public function test_nhan_vien_duoc_sua_ban_ghi_cua_bao_nhung_khong_duoc_xoa(): void
    {
        $mine = $this->customerOwnedBy($this->u1, 'KH-MINH');

        $this->putJson('/api/customers/'.$mine->id, ['name' => 'Ten da sua'], $this->tokenFor($this->u1))
            ->assertOk()
            ->assertJsonPath('data.name', 'Ten da sua');

        $this->deleteJson('/api/customers/'.$mine->id, [], $this->tokenFor($this->u1))
            ->assertStatus(403);

        $this->assertDatabaseHas('customers', ['id' => $mine->id]);
    }

    public function test_truong_nhom_xoa_duoc_ban_ghi_trong_pham_vi(): void
    {
        $customer = $this->customerOwnedBy($this->u1, 'KH-MINH');

        $this->deleteJson('/api/customers/'.$customer->id, [], $this->tokenFor($this->lead1))
            ->assertOk();

        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }

    public function test_truong_nhom_khong_xoa_duoc_ban_ghi_ngoai_nhom(): void
    {
        $customer = $this->customerOwnedBy($this->u4, 'KH-DUNG');

        $this->deleteJson('/api/customers/'.$customer->id, [], $this->tokenFor($this->lead1))
            ->assertStatus(403);

        $this->assertDatabaseHas('customers', ['id' => $customer->id]);
    }

    public function test_tim_kiem_va_loc_theo_trang_thai(): void
    {
        Customer::factory()->create([
            'owner_id' => $this->u1->id,
            'team_id' => $this->team1->id,
            'code' => 'KH-AAA',
            'name' => 'Cong ty Minh Khai',
            'status' => 'active',
        ]);
        Customer::factory()->create([
            'owner_id' => $this->u1->id,
            'team_id' => $this->team1->id,
            'code' => 'KH-BBB',
            'name' => 'Cong ty Ba Long',
            'status' => 'lead',
        ]);

        $this->getJson('/api/customers?q=Minh+Khai', $this->tokenFor($this->u1))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'KH-AAA');

        $this->getJson('/api/customers?status=lead', $this->tokenFor($this->u1))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'KH-BBB');
    }

    public function test_xuat_excel_chi_chua_ban_ghi_trong_pham_vi(): void
    {
        $this->customerOwnedBy($this->u1, 'KH-MINH');
        $this->customerOwnedBy($this->u2, 'KH-HA');

        $response = $this->get('/api/customers/export', $this->tokenFor($this->u1));

        $response->assertOk();
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('Content-Type'));

        $csv = $response->streamedContent();
        $this->assertStringContainsString('KH-MINH', $csv);
        $this->assertStringNotContainsString('KH-HA', $csv);
    }
}
