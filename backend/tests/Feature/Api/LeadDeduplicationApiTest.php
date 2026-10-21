<?php

namespace Tests\Feature\Api;

use App\Models\Customer;
use App\Models\Lead;
use App\Models\LeadActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadDeduplicationApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_store_lead_returns_duplicate_warning(): void
    {
        Lead::factory()->create(['email' => 'dup@test.com']);

        $response = $this->actingAs($this->user)->postJson('/api/leads', [
            'first_name' => 'John',
            'last_name'  => 'Doe',
            'email'      => 'dup@test.com',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'first_name', 'last_name', 'email'],
                'warning' => [
                    'lead_id',
                    'has_duplicates',
                    'duplicate_leads',
                    'suggestion',
                ],
            ])
            ->assertJsonPath('warning.has_duplicates', true);
    }

    public function test_store_lead_no_duplicate_warning_for_unique(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/leads', [
            'first_name' => 'Jane',
            'last_name'  => 'Unique',
            'email'      => 'unique@test.com',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('warning', null);
    }

    public function test_check_duplicates_endpoint(): void
    {
        $lead1 = Lead::factory()->create(['email' => 'same@test.com']);
        $lead2 = Lead::factory()->create(['email' => 'same@test.com']);

        $response = $this->actingAs($this->user)
            ->getJson("/api/leads/{$lead1->id}/check-duplicates");

        $response->assertOk()
            ->assertJsonPath('has_duplicates', true)
            ->assertJsonCount(1, 'duplicate_leads');
    }

    public function test_merge_leads_endpoint(): void
    {
        $primary   = Lead::factory()->create();
        $secondary = Lead::factory()->create();

        LeadActivityLog::factory()->count(2)->create([
            'lead_id'    => $secondary->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->postJson('/api/leads/merge', [
            'primary_lead_id'   => $primary->id,
            'secondary_lead_id' => $secondary->id,
            'merge_reason'      => 'Confirmed duplicate',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Gộp lead thành công.');

        $this->assertDatabaseHas('leads', [
            'id'     => $secondary->id,
            'status' => 'merged',
        ]);
    }

    public function test_merge_leads_validation_same_id(): void
    {
        $lead = Lead::factory()->create();

        $response = $this->actingAs($this->user)->postJson('/api/leads/merge', [
            'primary_lead_id'   => $lead->id,
            'secondary_lead_id' => $lead->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_link_to_customer_endpoint(): void
    {
        $lead     = Lead::factory()->create();
        $customer = Customer::factory()->create();

        $response = $this->actingAs($this->user)
            ->postJson("/api/leads/{$lead->id}/link-customer", [
                'customer_id' => $customer->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Lead đã được gắn vào hồ sơ khách hàng.');

        $this->assertDatabaseHas('leads', [
            'id'                 => $lead->id,
            'linked_customer_id' => $customer->id,
            'status'             => 'converted',
        ]);
    }

    public function test_index_endpoint_filters_and_pagination(): void
    {
        Lead::factory()->count(25)->create();

        $response = $this->actingAs($this->user)
            ->getJson('/api/leads?per_page=10&page=1');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'first_name', 'last_name', 'email']],
                'meta' => ['current_page', 'last_page', 'total'],
            ]);
    }

    public function test_store_lead_validation_errors(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/leads', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name']);
    }
}
