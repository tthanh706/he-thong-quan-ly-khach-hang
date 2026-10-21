<?php

namespace Tests\Feature\Api;

use App\Models\Opportunity;
use App\Models\PipelineStage;
use App\Models\StageTransitionCondition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PipelineStageConditionApiTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;
    private User $salesRep;

    protected function setUp(): void
    {
        parent::setUp();
        $this->manager  = User::factory()->create(['role' => 'manager']);
        $this->salesRep = User::factory()->create(['role' => 'sales_rep']);
    }

    public function test_list_stages_with_conditions(): void
    {
        $stage = PipelineStage::factory()->create(['pipeline_id' => 1]);
        StageTransitionCondition::factory()->create(['pipeline_stage_id' => $stage->id]);

        $response = $this->actingAs($this->manager)->getJson('/api/pipelines/1/stages');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'slug', 'position', 'conditions']],
            ]);
    }

    public function test_store_condition_by_manager(): void
    {
        $stage = PipelineStage::factory()->create();

        $response = $this->actingAs($this->manager)->postJson("/api/stages/{$stage->id}/conditions", [
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần ít nhất 1 cuộc gặp.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.condition_type', 'has_activity');
    }

    public function test_store_condition_forbidden_for_sales_rep(): void
    {
        $stage = PipelineStage::factory()->create();

        $response = $this->actingAs($this->salesRep)->postJson("/api/stages/{$stage->id}/conditions", [
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần meeting.',
        ]);

        $response->assertStatus(403);
    }

    public function test_validate_transition_endpoint(): void
    {
        $opportunity = Opportunity::factory()->create();
        $stage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần meeting.',
            'is_active'         => true,
        ]);

        $response = $this->actingAs($this->salesRep)
            ->postJson("/api/opportunities/{$opportunity->id}/validate-transition", [
                'target_stage_id' => $stage->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.can_transition', false)
            ->assertJsonCount(1, 'data.failed_conditions');
    }

    public function test_transition_blocked_returns_422(): void
    {
        $opportunity = Opportunity::factory()->create();
        $stage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần ít nhất 1 cuộc gặp.',
            'is_active'         => true,
        ]);

        $response = $this->actingAs($this->salesRep)
            ->postJson("/api/opportunities/{$opportunity->id}/transition", [
                'target_stage_id' => $stage->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('blocked', true)
            ->assertJsonStructure(['failed_conditions']);
    }

    public function test_transition_with_override_by_manager(): void
    {
        $opportunity = Opportunity::factory()->create();
        $stage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần meeting.',
            'is_active'         => true,
        ]);

        $response = $this->actingAs($this->manager)
            ->postJson("/api/opportunities/{$opportunity->id}/transition", [
                'target_stage_id'  => $stage->id,
                'is_override'      => true,
                'override_reason'  => 'Đã xác nhận bằng kênh khác.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.overridden', true);

        $this->assertDatabaseHas('stage_transition_overrides', [
            'opportunity_id' => $opportunity->id,
            'overridden_by'  => $this->manager->id,
        ]);
    }

    public function test_override_forbidden_for_sales_rep(): void
    {
        $opportunity = Opportunity::factory()->create();
        $stage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần meeting.',
            'is_active'         => true,
        ]);

        $response = $this->actingAs($this->salesRep)
            ->postJson("/api/opportunities/{$opportunity->id}/transition", [
                'target_stage_id'  => $stage->id,
                'is_override'      => true,
                'override_reason'  => 'Thử ghi đè.',
            ]);

        $response->assertStatus(403);
    }

    public function test_override_requires_reason(): void
    {
        $opportunity = Opportunity::factory()->create();
        $stage = PipelineStage::factory()->create();

        $response = $this->actingAs($this->manager)
            ->postJson("/api/opportunities/{$opportunity->id}/transition", [
                'target_stage_id' => $stage->id,
                'is_override'     => true,
                // missing override_reason
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['override_reason']);
    }

    public function test_delete_condition(): void
    {
        $stage = PipelineStage::factory()->create();
        $condition = StageTransitionCondition::factory()->create(['pipeline_stage_id' => $stage->id]);

        $response = $this->actingAs($this->manager)
            ->deleteJson("/api/conditions/{$condition->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('stage_transition_conditions', ['id' => $condition->id]);
    }
}
