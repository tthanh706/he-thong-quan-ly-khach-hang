<?php

namespace App\Services;

use App\Enums\OpportunityAlertTypeEnum;
use App\Enums\OpportunityStatusEnum;
use App\Models\Opportunity;
use App\Models\OpportunityActivity;
use App\Models\OpportunityStageSlaConfig;
use App\Models\OpportunityStagnationAlert;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class OpportunityStagnationService
{
    public function addActivity(
        Opportunity $opportunity,
        User $user,
        string $type,
        ?string $note = null,
        ?string $activityAt = null
    ): OpportunityActivity {
        return DB::transaction(function () use (
            $opportunity,
            $user,
            $type,
            $note,
            $activityAt
        ): OpportunityActivity {
            $activity = OpportunityActivity::create([
                'opportunity_id' => $opportunity->id,
                'user_id' => $user->id,
                'type' => $type,
                'note' => $note,
                'activity_at' => $activityAt ?? now(),
            ]);

            $opportunity->update([
                'last_activity_at' => $activity->activity_at,
                'stagnation_flagged_at' => null,
            ]);

            OpportunityStagnationAlert::query()
                ->where('opportunity_id', $opportunity->id)
                ->where(
                    'type',
                    OpportunityAlertTypeEnum::STAGNANT->value
                )
                ->delete();

            return $activity->fresh([
                'user',
                'opportunity',
            ]);
        });
    }

    public function checkOpportunities(): array
    {
        $stagnantCount = 0;
        $overdueCloseCount = 0;

        $opportunities = Opportunity::query()
            ->where('status', OpportunityStatusEnum::OPEN->value)
            ->get();

        foreach ($opportunities as $opportunity) {
            if ($this->checkStagnation($opportunity)) {
                $stagnantCount++;
            }

            if ($this->checkOverdueClose($opportunity)) {
                $overdueCloseCount++;
            }
        }

        return [
            'stagnant_count' => $stagnantCount,
            'overdue_close_count' => $overdueCloseCount,
            'total_flagged' => $stagnantCount + $overdueCloseCount,
        ];
    }

    public function checkStagnation(
        Opportunity $opportunity
    ): bool {
        if ($opportunity->status !== OpportunityStatusEnum::OPEN) {
            return false;
        }

        $config = OpportunityStageSlaConfig::query()
            ->where('stage', $opportunity->stage)
            ->where('is_active', true)
            ->first();

        if (!$config) {
            return false;
        }

        $referenceTime = $opportunity->last_activity_at
            ?? $opportunity->created_at;

        if (!$referenceTime) {
            return false;
        }

        $deadline = $referenceTime
            ->copy()
            ->addDays($config->inactivity_days);

        if (now()->lessThanOrEqualTo($deadline)) {
            return false;
        }

        DB::transaction(function () use (
            $opportunity,
            $config
        ): void {
            if (!$opportunity->stagnation_flagged_at) {
                $opportunity->update([
                    'stagnation_flagged_at' => now(),
                ]);
            }

            OpportunityStagnationAlert::firstOrCreate(
                [
                    'opportunity_id' => $opportunity->id,
                    'type' => OpportunityAlertTypeEnum::STAGNANT->value,
                ],
                [
                    'recipient_user_id' => $opportunity->team_leader_id,
                    'message' => sprintf(
                        'Cơ hội không có hoạt động trong quá %d ngày tại giai đoạn "%s".',
                        $config->inactivity_days,
                        $opportunity->stage
                    ),
                    'detected_at' => now(),
                ]
            );
        });

        return true;
    }

    public function checkOverdueClose(
        Opportunity $opportunity
    ): bool {
        if ($opportunity->status !== OpportunityStatusEnum::OPEN) {
            return false;
        }

        if (!$opportunity->expected_close_date) {
            return false;
        }

        if (
            $opportunity->expected_close_date
                ->startOfDay()
                ->greaterThanOrEqualTo(today())
        ) {
            return false;
        }

        DB::transaction(function () use ($opportunity): void {
            if (!$opportunity->overdue_close_flagged_at) {
                $opportunity->update([
                    'overdue_close_flagged_at' => now(),
                ]);
            }

            OpportunityStagnationAlert::firstOrCreate(
                [
                    'opportunity_id' => $opportunity->id,
                    'type' => OpportunityAlertTypeEnum::OVERDUE_CLOSE->value,
                ],
                [
                    'recipient_user_id' => $opportunity->team_leader_id,
                    'message' => sprintf(
                        'Cơ hội đã quá ngày dự kiến chốt %s nhưng vẫn chưa đóng.',
                        $opportunity->expected_close_date->format('d/m/Y')
                    ),
                    'detected_at' => now(),
                ]
            );
        });

        return true;
    }

    public function getAlertsForTeamLeader(
        User $teamLeader
    ): Collection {
        return OpportunityStagnationAlert::query()
            ->with([
                'opportunity.owner',
                'opportunity.teamLeader',
                'recipient',
            ])
            ->where(
                'recipient_user_id',
                $teamLeader->id
            )
            ->latest('detected_at')
            ->get();
    }

    public function getProblemOpportunitiesForTeamLeader(
        User $teamLeader
    ): Collection {
        return Opportunity::query()
            ->with([
                'owner',
                'teamLeader',
                'alerts',
            ])
            ->where(
                'team_leader_id',
                $teamLeader->id
            )
            ->where(function ($query): void {
                $query
                    ->whereNotNull('stagnation_flagged_at')
                    ->orWhereNotNull(
                        'overdue_close_flagged_at'
                    );
            })
            ->orderByDesc('updated_at')
            ->get();
    }
}