<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Customer;
use App\Models\Role;
use App\Models\SavedFilter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerProfileAndFilterTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $teamLeader;
    protected User $staffA;
    protected User $staffB;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Admin']);
        $leaderRole = Role::firstOrCreate(['name' => 'team_leader'], ['display_name' => 'Trưởng nhóm']);
        $staffRole = Role::firstOrCreate(['name' => 'staff'], ['display_name' => 'Nhân viên']);

        $this->admin = User::factory()->create([
            'name' => 'Quản trị viên',
            'role' => 'admin',
            'data_scope' => 'ALL',
        ]);
        $this->admin->roles()->attach($adminRole->id);

        $this->teamLeader = User::factory()->create([
            'name' => 'Trưởng nhóm 1',
            'role' => 'team_leader',
            'data_scope' => 'TEAM',
            'business_group_id' => 1,
        ]);
        $this->teamLeader->roles()->attach($leaderRole->id);

        $this->staffA = User::factory()->create([
            'name' => 'Nhân viên A (cùng nhóm)',
            'role' => 'staff',
            'data_scope' => 'MINE',
            'business_group_id' => 1,
        ]);
        $this->staffA->roles()->attach($staffRole->id);

        $this->staffB = User::factory()->create([
            'name' => 'Nhân viên B (nhóm khác)',
            'role' => 'staff',
            'data_scope' => 'MINE',
            'business_group_id' => 2,
        ]);
        $this->staffB->roles()->attach($staffRole->id);
    }

    /**
     * S3-01: Nhân viên chỉ thấy khách hàng mình sở hữu; Trưởng nhóm thấy toàn nhóm
     */
    public function test_data_scope_filtering_between_staff_and_team_leader(): void
    {
        $custA = Customer::create([
            'name' => 'Công ty của Nhân viên A',
            'tax_code' => '0101010101',
            'status' => Customer::STATUS_LEAD,
            'owner_id' => $this->staffA->id,
        ]);

        $custB = Customer::create([
            'name' => 'Công ty của Nhân viên B',
            'tax_code' => '0202020202',
            'status' => Customer::STATUS_IN_PROGRESS,
            'owner_id' => $this->staffB->id,
        ]);

        // Staff A chỉ thấy khách hàng của mình
        $resStaffA = Customer::query()->dataScope($this->staffA)->get();
        $this->assertTrue($resStaffA->contains('id', $custA->id));
        $this->assertFalse($resStaffA->contains('id', $custB->id));

        // Team Leader thấy khách hàng của staff A (cùng nhóm 1) nhưng không thấy của staff B (nhóm 2)
        $resLeader = Customer::query()->dataScope($this->teamLeader)->get();
        $this->assertTrue($resLeader->contains('id', $custA->id));
        $this->assertFalse($resLeader->contains('id', $custB->id));

        // Admin thấy toàn bộ
        $resAdmin = Customer::query()->dataScope($this->admin)->get();
        $this->assertTrue($resAdmin->contains('id', $custA->id));
        $this->assertTrue($resAdmin->contains('id', $custB->id));
    }

    /**
     * S3-01: Mã số thuế nếu có thì phải là duy nhất
     */
    public function test_tax_code_must_be_unique_when_provided(): void
    {
        Customer::create([
            'name' => 'Công ty Đầu Tiên',
            'tax_code' => '0312345678',
            'status' => Customer::STATUS_CUSTOMER,
            'owner_id' => $this->staffA->id,
        ]);

        $this->actingAs($this->staffA);

        // Tạo khách hàng thứ hai trùng tax_code -> 422 Unprocessable Entity
        $response = $this->postJson('/api/v1/customers', [
            'name' => 'Công ty Trùng MST',
            'tax_code' => '0312345678',
            'status' => 'Tiềm năng',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['tax_code']);
    }

    /**
     * S3-01: Khách hàng có 4 trạng thái chuẩn
     */
    public function test_customer_can_be_created_with_standard_statuses(): void
    {
        $statuses = [
            Customer::STATUS_LEAD,
            Customer::STATUS_IN_PROGRESS,
            Customer::STATUS_CUSTOMER,
            Customer::STATUS_STOPPED,
        ];

        foreach ($statuses as $idx => $st) {
            $customer = Customer::create([
                'name' => "Doanh nghiệp {$idx}",
                'tax_code' => "100000000{$idx}",
                'industry' => 'Công nghệ thông tin',
                'company_size' => Customer::SIZE_MEDIUM,
                'website' => 'https://fpt.com',
                'address' => 'Hà Nội',
                'area' => 'Miền Bắc',
                'status' => $st,
                'owner_id' => $this->staffA->id,
            ]);

            $this->assertEquals($st, $customer->status);
        }
    }

    /**
     * S3-07: Tìm kiếm theo số điện thoại người liên hệ
     */
    public function test_search_customer_by_contact_phone(): void
    {
        $customer = Customer::create([
            'name' => 'Tập đoàn ABC',
            'tax_code' => '0987654321',
            'status' => Customer::STATUS_CUSTOMER,
            'owner_id' => $this->staffA->id,
        ]);

        Contact::create([
            'customer_id' => $customer->id,
            'name' => 'Nguyễn Liên Hệ',
            'phone' => '0912999888',
            'email' => 'contact@abc.vn',
            'title' => 'Giám đốc mua hàng',
        ]);

        $service = app(\App\Services\CustomerService::class);

        // Tìm theo SĐT người liên hệ trong thanh search tổng hợp
        $found = $service->getFilteredCustomers(['search' => '0912999888'], $this->staffA);
        $this->assertTrue($found->contains('id', $customer->id));

        // Tìm theo contact_phone
        $foundSpecific = $service->getFilteredCustomers(['contact_phone' => '0912999888'], $this->staffA);
        $this->assertTrue($foundSpecific->contains('id', $customer->id));
    }

    /**
     * S3-07: Lưu lại được bộ lọc hay dùng
     */
    public function test_save_and_retrieve_saved_filters(): void
    {
        $service = app(\App\Services\CustomerService::class);

        $filterData = [
            'status' => Customer::STATUS_LEAD,
            'industry' => 'Bất động sản',
            'company_size' => Customer::SIZE_LARGE,
        ];

        $saved = $service->saveFilter($this->staffA, 'Khách BĐS cần gọi trong tuần', $filterData);

        $this->assertDatabaseHas('saved_filters', [
            'id' => $saved->id,
            'name' => 'Khách BĐS cần gọi trong tuần',
            'user_id' => $this->staffA->id,
        ]);

        $list = $service->getSavedFilters($this->staffA);
        $this->assertCount(1, $list);
        $this->assertEquals('Khách BĐS cần gọi trong tuần', $list->first()->name);

        $deleted = $service->deleteSavedFilter($this->staffA, $saved->id);
        $this->assertTrue($deleted);
        $this->assertDatabaseMissing('saved_filters', ['id' => $saved->id]);
    }
}
