<?php

namespace Tests\Feature;

use App\Enums\DataScope;
use App\Models\Customer;

class ModuleScopeTest extends ScopedApiTestCase
{
    public function test_co_hoi_chan_theo_pham_vi(): void
    {
        $mine = $this->opportunityOwnedBy($this->u1, 'CO-MINH');
        $this->opportunityOwnedBy($this->u2, 'CO-HA');
        $this->opportunityOwnedBy($this->u4, 'CO-DUNG');

        $this->getJson('/api/opportunities', $this->tokenFor($this->u1))
            ->assertOk()
            ->assertJsonPath('meta.total_visible', 1)
            ->assertJsonPath('data.0.id', $mine->id);

        $this->getJson('/api/opportunities', $this->tokenFor($this->lead1, DataScope::TEAM))
            ->assertOk()
            ->assertJsonPath('meta.total_visible', 2);

        $this->getJson('/api/opportunities', $this->tokenFor($this->director, DataScope::ALL))
            ->assertOk()
            ->assertJsonPath('meta.total_visible', 3);
    }

    public function test_tao_co_hoi_ghi_ten_khach_hang_va_tro_ve_thong_tin(): void
    {
        $customer = $this->customerOwnedBy($this->u1, 'KH-MINH');

        $this->postJson('/api/opportunities', [
            'code' => 'CO-NEW',
            'title' => 'Du an moi',
            'customer_id' => $customer->id,
            'amount' => 120000000,
            'stage' => 'proposal',
            'close_date' => '2026-09-30',
        ], $this->tokenFor($this->u1))
            ->assertCreated()
            ->assertJsonPath('data.customer_name', $customer->name)
            ->assertJsonPath('data.owner_id', $this->u1->id)
            ->assertJsonPath('data.stage', 'proposal');
    }

    public function test_hoat_dong_chan_theo_pham_vi_va_tien_do(): void
    {
        $this->activityOwnedBy($this->u1, 'Goi khach Minh Khai');
        $this->activityOwnedBy($this->u2, 'Tham khach Hoang Gia');
        $this->activityOwnedBy($this->u4, 'Goi khach Sai Gon');

        $this->getJson('/api/activities', $this->tokenFor($this->u1))
            ->assertOk()
            ->assertJsonPath('meta.total_visible', 1);

        $this->getJson('/api/activities', $this->tokenFor($this->director, DataScope::ALL))
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_tao_hoat_dong_gan_nguoi_thuc_hien(): void
    {
        $customer = $this->customerOwnedBy($this->u1, 'KH-MINH');

        $this->postJson('/api/activities', [
            'title' => 'Hop khoi dong',
            'type' => 'meeting',
            'customer_id' => $customer->id,
            'assignee_id' => $this->u2->id,
            'due_at' => '2026-10-01 09:00:00',
            'status' => 'todo',
        ], $this->tokenFor($this->u1))
            ->assertCreated()
            ->assertJsonPath('data.type', 'meeting')
            ->assertJsonPath('data.owner_id', $this->u1->id);
    }

    public function test_bao_gia_chan_theo_pham_vi(): void
    {
        $mine = $this->quoteOwnedBy($this->u1, 'BG-MINH');
        $this->quoteOwnedBy($this->u2, 'BG-HA');
        $this->quoteOwnedBy($this->u4, 'BG-DUNG');

        $this->getJson('/api/quotes', $this->tokenFor($this->u1))
            ->assertOk()
            ->assertJsonPath('meta.total_visible', 1)
            ->assertJsonPath('data.0.id', $mine->id);
    }

    public function test_tao_bao_gia_va_bien_giang_ho_so_(): void
    {
        $customer = $this->customerOwnedBy($this->u1, 'KH-MINH');
        $opportunity = $this->opportunityOwnedBy($this->u1, 'CO-MINH');

        $this->postJson('/api/quotes', [
            'code' => 'BG-NEW',
            'customer_id' => $customer->id,
            'opportunity_id' => $opportunity->id,
            'amount' => 99000000,
            'valid_until' => '2026-12-31',
            'status' => 'draft',
        ], $this->tokenFor($this->u1))
            ->assertCreated()
            ->assertJsonPath('data.amount', 99000000)
            ->assertJsonPath('data.opportunity_title', $opportunity->title)
            ->assertJsonPath('data.owner_id', $this->u1->id);
    }

    public function test_dashboard_chi_tinh_so_lieu_trong_pham_vi(): void
    {
        $mineCustomer = $this->customerOwnedBy($this->u1, 'KH-MINH');
        $otherCustomer = $this->customerOwnedBy($this->u2, 'KH-HA');
        $this->quoteOwnedBy($this->u1, 'BG-1', $mineCustomer);
        $this->quoteOwnedBy($this->u2, 'BG-2', $otherCustomer);

        $this->getJson('/api/dashboard', $this->tokenFor($this->u1))
            ->assertOk()
            ->assertJsonPath('data.counts.customers', 1)
            ->assertJsonPath('data.counts.quotes', 1)
            ->assertJsonPath('meta.hidden_counts.customers', 1)
            ->assertJsonPath('meta.hidden_counts.quotes', 1)
            ->assertJsonPath('meta.scope', 'own');
    }

    public function test_du_liet_chi_tiet_ban_ghi_khong_co_quan_he_(): void
    {
        $other = $this->opportunityOwnedBy($this->u2, 'CO-HA');

        $this->getJson('/api/opportunities/'.$other->id, $this->tokenFor($this->u1))
            ->assertStatus(403)
            ->assertJsonPath('entity', 'opportunity');
    }

    public function test_tim_bao_ghi_khong_ton_tai_tra_ve_422(): void
    {
        Customer::query()->delete();

        $this->getJson('/api/customers/99999', $this->tokenFor($this->u1))
            ->assertStatus(422)
            ->assertJsonValidationErrors('id');
    }
}
