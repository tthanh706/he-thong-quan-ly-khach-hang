<?php

namespace App\Services;

use App\Models\Opportunity;
use App\Models\PipelineStage;
use App\Models\StageTransitionCondition;
use App\Models\StageTransitionOverride;
use Illuminate\Support\Facades\DB;

class StageTransitionService
{
    /**
     * Result of validating transition conditions.
     *
     * @return array{
     *   can_transition: bool,
     *   failed_conditions: array<array{condition_id: int, condition_type: string, error_message: string}>,
     *   passed_conditions: array<array{condition_id: int, condition_type: string}>
     * }
     */
    public function validateTransition(Opportunity $opportunity, PipelineStage $targetStage): array
    {
        $conditions = $targetStage->activeConditions()->get();

        $passed = [];
        $failed = [];

        foreach ($conditions as $condition) {
            $result = $this->evaluateCondition($opportunity, $condition);

            if ($result) {
                $passed[] = [
                    'condition_id'   => $condition->id,
                    'condition_type' => $condition->condition_type,
                ];
            } else {
                $failed[] = [
                    'condition_id'   => $condition->id,
                    'condition_type' => $condition->condition_type,
                    'error_message'  => $condition->error_message,
                    'parameters'     => $condition->parameters,
                ];
            }
        }

        return [
            'can_transition'    => empty($failed),
            'failed_conditions' => $failed,
            'passed_conditions' => $passed,
        ];
    }

    /**
     * Attempt to transition an opportunity to a new stage.
     * Blocks if conditions are not met and user has no override permission.
     *
     * @throws \App\Exceptions\StageTransitionBlockedException
     */
    public function transitionStage(
        Opportunity $opportunity,
        PipelineStage $targetStage,
        int $userId,
        bool $isOverride = false,
        ?string $overrideReason = null
    ): Opportunity {
        return DB::transaction(function () use ($opportunity, $targetStage, $userId, $isOverride, $overrideReason) {
            $validation = $this->validateTransition($opportunity, $targetStage);

            if (!$validation['can_transition']) {
                if (!$isOverride) {
                    // Block transition and return failed conditions
                    throw new \App\Exceptions\StageTransitionBlockedException(
                        'Chuyển giai đoạn bị chặn: Chưa thỏa mãn điều kiện bắt buộc.',
                        $validation['failed_conditions']
                    );
                }

                // Override: Record audit log
                if (empty($overrideReason)) {
                    throw new \InvalidArgumentException(
                        'Lý do ghi đè (override_reason) là bắt buộc khi thực hiện override.'
                    );
                }

                StageTransitionOverride::create([
                    'opportunity_id'    => $opportunity->id,
                    'from_stage_id'     => $opportunity->pipeline_stage_id,
                    'to_stage_id'       => $targetStage->id,
                    'overridden_by'     => $userId,
                    'override_reason'   => $overrideReason,
                    'skipped_conditions' => $validation['failed_conditions'],
                ]);
            }

            // Perform the transition
            $opportunity->update([
                'pipeline_stage_id' => $targetStage->id,
            ]);

            return $opportunity->fresh(['pipelineStage']);
        });
    }

    /**
     * Evaluate a single condition against an opportunity.
     */
    private function evaluateCondition(Opportunity $opportunity, StageTransitionCondition $condition): bool
    {
        $params = $condition->parameters ?? [];

        return match ($condition->condition_type) {
            'has_activity'   => $this->checkHasActivity($opportunity, $params),
            'required_field' => $this->checkRequiredField($opportunity, $params),
            'min_value'      => $this->checkMinValue($opportunity, $params),
            'has_attachment' => $this->checkHasAttachment($opportunity, $params),
            'has_contact'    => $this->checkHasContact($opportunity, $params),
            default          => true, // Unknown types pass by default
        };
    }

    /**
     * Check: Opportunity has at least N activities of a specific type.
     * Example params: {"activity_type": "meeting", "min_count": 1}
     */
    private function checkHasActivity(Opportunity $opportunity, array $params): bool
    {
        $activityType = $params['activity_type'] ?? null;
        $minCount     = $params['min_count'] ?? 1;

        $query = $opportunity->activities();

        if ($activityType) {
            $query->where('type', $activityType);
        }

        return $query->count() >= $minCount;
    }

    /**
     * Check: A required field on the opportunity is not empty.
     * Example params: {"field_name": "expected_revenue"}
     */
    private function checkRequiredField(Opportunity $opportunity, array $params): bool
    {
        $fieldName = $params['field_name'] ?? null;

        if (!$fieldName) {
            return true;
        }

        $value = $opportunity->{$fieldName};

        return !empty($value) || $value === 0 || $value === '0';
    }

    /**
     * Check: Opportunity value meets minimum threshold.
     * Example params: {"min_value": 10000000}
     */
    private function checkMinValue(Opportunity $opportunity, array $params): bool
    {
        $minValue = $params['min_value'] ?? 0;

        return ($opportunity->value ?? 0) >= $minValue;
    }

    /**
     * Check: Opportunity has at least N attachments.
     * Example params: {"min_count": 1}
     */
    private function checkHasAttachment(Opportunity $opportunity, array $params): bool
    {
        $minCount = $params['min_count'] ?? 1;

        return $opportunity->attachments()->count() >= $minCount;
    }

    /**
     * Check: Opportunity has at least 1 contact person.
     */
    private function checkHasContact(Opportunity $opportunity, array $params): bool
    {
        $minCount = $params['min_count'] ?? 1;

        return $opportunity->contacts()->count() >= $minCount;
    }

    /**
     * Get all stages with their conditions for configuration view.
     */
    public function getStagesWithConditions(int $pipelineId): \Illuminate\Database\Eloquent\Collection
    {
        return PipelineStage::where('pipeline_id', $pipelineId)
            ->active()
            ->ordered()
            ->with('transitionConditions')
            ->get();
    }
}
