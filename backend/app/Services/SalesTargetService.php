<?php

namespace App\Services;

use App\Models\SalesTarget;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SalesTargetService
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    ) {
    }

    public function updateTargetValue(
        SalesTarget $salesTarget,
        float $newTargetValue,
        User $currentUser
    ): SalesTarget {
        return DB::transaction(function () use (
            $salesTarget,
            $newTargetValue,
            $currentUser
        ) {
            $oldTargetValue = $salesTarget->target_value;

            if ((float) $oldTargetValue === $newTargetValue) {
                return $salesTarget;
            }

            $salesTarget->target_value = $newTargetValue;
            $salesTarget->save();

            $this->auditLogService->logChange(
                $currentUser->id,
                'updated',
                'SalesTarget',
                $salesTarget->id,
                'target_value',
                $oldTargetValue,
                $newTargetValue
            );

            return $salesTarget->fresh();
        });
    }
}