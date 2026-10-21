<?php

namespace Tests\Unit\Services;

use App\Models\Customer;
use App\Models\Lead;
use App\Models\LeadActivityLog;
use App\Models\LeadMergeLog;
use App\Models\User;
use App\Services\LeadDeduplicationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadDeduplicationServiceTest extends TestCase
{
    use RefreshDatabase;

    private LeadDeduplicationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new LeadDeduplicationService();
    }

    // ─── Duplicate Detection ────────────────────────────────────────

    public function test_detects_duplicates_by_email(): void
    {
        $lead1 = Lead::factory()->create(['email' => 'dup@example.com']);
        $lead2 = Lead::factory()->create(['email' => 'dup@example.com']);

        $result = $this->service->detectDuplicates($lead1);

        $this->assertCount(1, $result['duplicate_leads']);
        $this->assertEquals($lead2->id, $result['duplicate_leads']->first()->id);
    }

    public function test_detects_duplicates_by_phone_number(): void
    {
        $lead1 = Lead::factory()->create(['phone_number' => '+84901234567', 'email' => null]);
        $lead2 = Lead::factory()->create(['phone_number' => '+84901234567', 'email' => null]);

        $result = $this->service->detectDuplicates($lead1);

        $this->assertCount(1, $result['duplicate_leads']);
        $this->assertEquals($lead2->id, $result['duplicate_leads']->first()->id);
    }

    public function test_detects_duplicates_by_company_name(): void
    {
        $lead1 = Lead::factory()->create(['company_name' => 'Acme Corp', 'email' => null, 'phone_number' => null]);
        $lead2 = Lead::factory()->create(['company_name' => 'Acme Corp', 'email' => null, 'phone_number' => null]);

        $result = $this->service->detectDuplicates($lead1);

        $this->assertCount(1, $result['duplicate_leads']);
    }

    public function test_does_not_detect_merged_leads_as_duplicates(): void
    {
        $lead1 = Lead::factory()->create(['email' => 'dup@example.com']);
        Lead::factory()->create(['email' => 'dup@example.com', 'status' => 'merged']);

        $result = $this->service->detectDuplicates($lead1);

        $this->assertCount(0, $result['duplicate_leads']);
    }

    public function test_finds_matching_customers(): void
    {
        $lead = Lead::factory()->create(['email' => 'existing@company.com']);
        $customer = Customer::factory()->create(['email' => 'existing@company.com']);

        $result = $this->service->detectDuplicates($lead);

        $this->assertCount(1, $result['matching_customers']);
        $this->assertEquals($customer->id, $result['matching_customers']->first()->id);
    }

    public function test_returns_no_duplicates_for_unique_lead(): void
    {
        $lead = Lead::factory()->create([
            'email'        => 'unique@example.com',
            'phone_number' => '+84999999999',
            'company_name' => 'Unique Corp',
        ]);

        $result = $this->service->detectDuplicates($lead);

        $this->assertCount(0, $result['duplicate_leads']);
        $this->assertCount(0, $result['matching_customers']);
    }

    // ─── Lead Merge ─────────────────────────────────────────────────

    public function test_merge_leads_moves_all_activities(): void
    {
        $user = User::factory()->create();
        $primaryLead   = Lead::factory()->create(['email' => 'primary@test.com']);
        $secondaryLead = Lead::factory()->create(['email' => 'secondary@test.com']);

        // Create activities on secondary lead
        LeadActivityLog::factory()->count(3)->create(['lead_id' => $secondaryLead->id, 'created_by' => $user->id]);
        LeadActivityLog::factory()->count(2)->create(['lead_id' => $primaryLead->id, 'created_by' => $user->id]);

        $result = $this->service->mergeLeads($primaryLead, $secondaryLead, $user->id);

        // All activities now belong to primary (original 2 + moved 3 + 1 merge log)
        $this->assertEquals(6, $result->activityLogs->count());
    }

    public function test_merge_leads_marks_secondary_as_merged(): void
    {
        $user = User::factory()->create();
        $primary   = Lead::factory()->create();
        $secondary = Lead::factory()->create();

        $this->service->mergeLeads($primary, $secondary, $user->id);

        $secondary->refresh();
        $this->assertEquals('merged', $secondary->status);
        $this->assertEquals($primary->id, $secondary->merged_into_lead_id);
        $this->assertNotNull($secondary->deleted_at);
    }

    public function test_merge_leads_creates_audit_log(): void
    {
        $user = User::factory()->create();
        $primary   = Lead::factory()->create();
        $secondary = Lead::factory()->create();

        $this->service->mergeLeads($primary, $secondary, $user->id, 'Duplicate entry');

        $mergeLog = LeadMergeLog::where('primary_lead_id', $primary->id)->first();
        $this->assertNotNull($mergeLog);
        $this->assertEquals($secondary->id, $mergeLog->merged_lead_id);
        $this->assertEquals($user->id, $mergeLog->performed_by);
        $this->assertEquals('Duplicate entry', $mergeLog->merge_reason);
        $this->assertNotNull($mergeLog->primary_lead_snapshot);
        $this->assertNotNull($mergeLog->merged_lead_snapshot);
    }

    public function test_merge_fills_blank_fields_from_secondary(): void
    {
        $user = User::factory()->create();
        $primary   = Lead::factory()->create(['email' => 'primary@test.com', 'phone_number' => null]);
        $secondary = Lead::factory()->create(['email' => 'secondary@test.com', 'phone_number' => '+84123456789']);

        $result = $this->service->mergeLeads($primary, $secondary, $user->id);

        $this->assertEquals('primary@test.com', $result->email);
        $this->assertEquals('+84123456789', $result->phone_number);
    }

    public function test_merge_cannot_merge_lead_into_itself(): void
    {
        $user = User::factory()->create();
        $lead = Lead::factory()->create();

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot merge a lead into itself.');

        $this->service->mergeLeads($lead, $lead, $user->id);
    }

    public function test_merge_cannot_merge_already_merged_lead(): void
    {
        $user = User::factory()->create();
        $primary   = Lead::factory()->create();
        $secondary = Lead::factory()->create(['status' => 'merged']);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('The secondary lead has already been merged.');

        $this->service->mergeLeads($primary, $secondary, $user->id);
    }

    // ─── Link to Customer ───────────────────────────────────────────

    public function test_link_lead_to_customer(): void
    {
        $user     = User::factory()->create();
        $lead     = Lead::factory()->create(['status' => 'qualified']);
        $customer = Customer::factory()->create();

        $result = $this->service->linkLeadToCustomer($lead, $customer, $user->id);

        $this->assertEquals('converted', $result->status);
        $this->assertEquals($customer->id, $result->linked_customer_id);
    }

    public function test_link_creates_activity_log(): void
    {
        $user     = User::factory()->create();
        $lead     = Lead::factory()->create();
        $customer = Customer::factory()->create();

        $this->service->linkLeadToCustomer($lead, $customer, $user->id);

        $activity = LeadActivityLog::where('lead_id', $lead->id)
            ->where('type', 'status_change')
            ->first();

        $this->assertNotNull($activity);
        $this->assertStringContainsString('linked to customer', $activity->subject);
    }
}
