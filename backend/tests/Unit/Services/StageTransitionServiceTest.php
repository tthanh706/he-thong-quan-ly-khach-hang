<?php

namespace Tests\Unit\Services;

use App\Exceptions\StageTransitionBlockedException;
use App\Models\Opportunity;
use App\Models\PipelineStage;
use App\Models\StageTransitionCondition;
use App\Models\StageTransitionOverride;
use App\Models\User;
use App\Services\StageTransitionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StageTransitionServiceTest extends TestCase
{
    use RefreshDatabase;

    private StageTransitionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new StageTransitionService();
    }

    // ─── Validation ─────────────────────────────────────────────────

    public function test_validates_transition_passes_when_no_conditions(): void
    {
        $opportunity = Opportunity::factory()->create();
        $stage = PipelineStage::factory()->create();

        $result = $this->service->validateTransition($opportunity, $stage);

        $this->assertTrue($result['can_transition']);
        $this->assertEmpty($result['failed_conditions']);
    }

    public function test_validates_transition_fails_when_has_activity_condition_not_met(): void
    {
        $opportunity = Opportunity::factory()->create();
        $stage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần ít nhất 1 cuộc gặp (meeting) trước khi chuyển giai đoạn.',
            'is_active'         => true,
        ]);

        $result = $this->service->validateTransition($opportunity, $stage);

        $this->assertFalse($result['can_transition']);
        $this->assertCount(1, $result['failed_conditions']);
        $this->assertEquals('has_activity', $result['failed_conditions'][0]['condition_type']);
    }

    public function test_validates_transition_passes_when_activity_condition_met(): void
    {
        $user = User::factory()->create();
        $opportunity = Opportunity::factory()->create();
        $stage = PipelineStage::factory()->create();

        // Create the required meeting activity
        $opportunity->activities()->create([
            'type'       => 'meeting',
            'subject'    => 'Discovery call',
            'created_by' => $user->id,
        ]);

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần ít nhất 1 cuộc gặp.',
            'is_active'         => true,
        ]);

        $result = $this->service->validateTransition($opportunity, $stage);

        $this->assertTrue($result['can_transition']);
        $this->assertEmpty($result['failed_conditions']);
    }

    public function test_validates_required_field_condition(): void
    {
        $opportunity = Opportunity::factory()->create(['expected_revenue' => null]);
        $stage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'required_field',
            'parameters'        => ['field_name' => 'expected_revenue'],
            'error_message'     => 'Doanh thu kỳ vọng là bắt buộc.',
            'is_active'         => true,
        ]);

        $result = $this->service->validateTransition($opportunity, $stage);

        $this->assertFalse($result['can_transition']);
    }

    public function test_validates_min_value_condition(): void
    {
        $opportunity = Opportunity::factory()->create(['value' => 5000000]);
        $stage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'min_value',
            'parameters'        => ['min_value' => 10000000],
            'error_message'     => 'Giá trị thương vụ tối thiểu 10 triệu.',
            'is_active'         => true,
        ]);

        $result = $this->service->validateTransition($opportunity, $stage);

        $this->assertFalse($result['can_transition']);
        $this->assertStringContainsString('10 triệu', $result['failed_conditions'][0]['error_message']);
    }

    public function test_inactive_conditions_are_ignored(): void
    {
        $opportunity = Opportunity::factory()->create();
        $stage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần meeting.',
            'is_active'         => false, // Inactive
        ]);

        $result = $this->service->validateTransition($opportunity, $stage);

        $this->assertTrue($result['can_transition']);
    }

    public function test_multiple_conditions_all_checked(): void
    {
        $opportunity = Opportunity::factory()->create(['expected_revenue' => null, 'value' => 0]);
        $stage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần meeting.',
            'is_active'         => true,
        ]);

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $stage->id,
            'condition_type'    => 'required_field',
            'parameters'        => ['field_name' => 'expected_revenue'],
            'error_message'     => 'Cần doanh thu kỳ vọng.',
            'is_active'         => true,
        ]);

        $result = $this->service->validateTransition($opportunity, $stage);

        $this->assertFalse($result['can_transition']);
        $this->assertCount(2, $result['failed_conditions']);
    }

    // ─── Stage Transition ───────────────────────────────────────────

    public function test_transition_succeeds_when_all_conditions_met(): void
    {
        $user = User::factory()->create();
        $opportunity = Opportunity::factory()->create();
        $targetStage = PipelineStage::factory()->create(); // No conditions

        $result = $this->service->transitionStage($opportunity, $targetStage, $user->id);

        $this->assertEquals($targetStage->id, $result->pipeline_stage_id);
    }

    public function test_transition_blocked_when_conditions_not_met(): void
    {
        $user = User::factory()->create();
        $opportunity = Opportunity::factory()->create();
        $targetStage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $targetStage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần meeting.',
            'is_active'         => true,
        ]);

        $this->expectException(StageTransitionBlockedException::class);

        $this->service->transitionStage($opportunity, $targetStage, $user->id);
    }

    public function test_override_transition_succeeds_with_reason(): void
    {
        $user = User::factory()->create(['role' => 'manager']);
        $opportunity = Opportunity::factory()->create();
        $targetStage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $targetStage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần meeting.',
            'is_active'         => true,
        ]);

        $result = $this->service->transitionStage(
            $opportunity,
            $targetStage,
            $user->id,
            isOverride: true,
            overrideReason: 'Khách hàng VIP, đã trao đổi qua điện thoại.'
        );

        $this->assertEquals($targetStage->id, $result->pipeline_stage_id);

        // Verify audit log
        $override = StageTransitionOverride::where('opportunity_id', $opportunity->id)->first();
        $this->assertNotNull($override);
        $this->assertEquals($user->id, $override->overridden_by);
        $this->assertStringContainsString('VIP', $override->override_reason);
        $this->assertNotEmpty($override->skipped_conditions);
    }

    public function test_override_requires_reason(): void
    {
        $user = User::factory()->create(['role' => 'manager']);
        $opportunity = Opportunity::factory()->create();
        $targetStage = PipelineStage::factory()->create();

        StageTransitionCondition::factory()->create([
            'pipeline_stage_id' => $targetStage->id,
            'condition_type'    => 'has_activity',
            'parameters'        => ['activity_type' => 'meeting', 'min_count' => 1],
            'error_message'     => 'Cần meeting.',
            'is_active'         => true,
        ]);

        $this->expectException(\InvalidArgumentException::class);

        $this->service->transitionStage(
            $opportunity,
            $targetStage,
            $user->id,
            isOverride: true,
            overrideReason: null
        );
    }
}
