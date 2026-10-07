<?php
namespace Tests\Feature;

use App\Models\BusinessGroup;
use App\Models\Customer;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DataScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_a_cannot_read_employee_b_customer(): void
    {
        $group = BusinessGroup::create(['name' => 'Nhóm A']);
        $employeeA = User::factory()->create(['role'=>'SALES_REP','data_scope'=>'MINE','business_group_id'=>$group->id]);
        $employeeB = User::factory()->create(['role'=>'SALES_REP','data_scope'=>'MINE','business_group_id'=>$group->id]);
        $customerB = Customer::create(['name'=>'Khách của B','owner_id'=>$employeeB->id,'business_group_id'=>$group->id]);
        $session = UserSession::create(['user_id'=>$employeeA->id,'token'=>str_repeat('a',64),'last_activity'=>now(),'expires_at'=>now()->addMinutes(30),'revoked'=>false]);

        $this->withHeader('Authorization', 'Bearer '.$session->token)
            ->getJson('/api/customers/'.$customerB->id)
            ->assertForbidden()
            ->assertJsonFragment(['message' => 'Bạn không có quyền truy cập bản ghi này vì nằm ngoài phạm vi dữ liệu được phép.']);
    }
}
