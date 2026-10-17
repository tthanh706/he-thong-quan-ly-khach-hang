<?php

namespace App\Services;

use App\Enums\SalesActivityTypeEnum;
use App\Models\Lead;
use App\Models\SalesActivity;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TeamPerformanceService
{
    public function getReport(
        User $teamLeader,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?int $userId = null
    ): array {
        [$start, $end] = $this->resolveRange(
            $dateFrom,
            $dateTo
        );

        $members = $this->getTeamMembers(
            $teamLeader,
            $start,
            $end,
            $userId
        );

        $rows = $members
            ->map(function (User $member) use (
                $teamLeader,
                $start,
                $end
            ): array {
                return $this->buildMemberReport(
                    $teamLeader,
                    $member,
                    $start,
                    $end
                );
            })
            ->values();

        return [
            'period' => [
                'date_from' => $start->toDateString(),
                'date_to' => $end->toDateString(),
            ],

            'summary' => $this->buildSummary(
                $rows
            ),

            'members' => $rows,
        ];
    }

    public function getMembers(
        User $teamLeader
    ): Collection {
        $activityUserIds = SalesActivity::query()
            ->where(
                'team_leader_id',
                $teamLeader->id
            )
            ->pluck('user_id');

        $leadUserIds = Lead::query()
            ->where(
                'team_leader_id',
                $teamLeader->id
            )
            ->whereNotNull('assigned_to')
            ->pluck('assigned_to');

        $userIds = collect()
            ->merge($activityUserIds)
            ->merge($leadUserIds)
            ->unique()
            ->values();

        return User::query()
            ->whereIn(
                'id',
                $userIds
            )
            ->orderBy('name')
            ->get();
    }

    private function buildMemberReport(
        User $teamLeader,
        User $member,
        Carbon $start,
        Carbon $end
    ): array {
        $activities = SalesActivity::query()
            ->where(
                'team_leader_id',
                $teamLeader->id
            )
            ->where(
                'user_id',
                $member->id
            )
            ->whereBetween(
                'occurred_at',
                [
                    $start->copy()->startOfDay(),
                    $end->copy()->endOfDay(),
                ]
            )
            ->get();

        $calls = $activities
            ->filter(
                fn (SalesActivity $activity): bool =>
                    $activity->activity_type
                    === SalesActivityTypeEnum::CALL
            )
            ->count();

        $meetings = $activities
            ->filter(
                fn (SalesActivity $activity): bool =>
                    $activity->activity_type
                    === SalesActivityTypeEnum::MEETING
            )
            ->count();

        $quotations = $activities
            ->filter(
                fn (SalesActivity $activity): bool =>
                    $activity->activity_type
                    === SalesActivityTypeEnum::QUOTATION
            )
            ->count();

        $leads = Lead::query()
            ->where(
                'team_leader_id',
                $teamLeader->id
            )
            ->where(
                'assigned_to',
                $member->id
            )
            ->whereBetween(
                'assigned_at',
                [
                    $start->copy()->startOfDay(),
                    $end->copy()->endOfDay(),
                ]
            )
            ->get();

        $assignedLeads = $leads->count();

        $respondedLeads = $leads
            ->filter(
                fn (Lead $lead): bool =>
                    $lead->contacted_at !== null
            )
            ->count();

        $respondedWithinSla = $leads
            ->filter(
                fn (Lead $lead): bool =>
                    $lead->contacted_at !== null
                    && $lead->sla_deadline !== null
                    && $lead->contacted_at
                        ->lessThanOrEqualTo(
                            $lead->sla_deadline
                        )
            )
            ->count();

        $missedSla = $assignedLeads
            - $respondedWithinSla;

        $slaRate = $assignedLeads > 0
            ? round(
                (
                    $respondedWithinSla
                    / $assignedLeads
                ) * 100,
                2
            )
            : 0;

        return [
            'user_id' => $member->id,
            'name' => $member->name,
            'email' => $member->email,

            'calls' => $calls,
            'meetings' => $meetings,
            'quotations' => $quotations,

            'total_activities' =>
                $calls
                + $meetings
                + $quotations,

            'assigned_leads' =>
                $assignedLeads,

            'responded_leads' =>
                $respondedLeads,

            'responded_within_sla' =>
                $respondedWithinSla,

            'missed_sla' =>
                $missedSla,

            'sla_rate' =>
                $slaRate,
        ];
    }

    private function buildSummary(
        Collection $rows
    ): array {
        $assignedLeads = (int) $rows->sum(
            'assigned_leads'
        );

        $withinSla = (int) $rows->sum(
            'responded_within_sla'
        );

        return [
            'member_count' =>
                $rows->count(),

            'calls' =>
                (int) $rows->sum('calls'),

            'meetings' =>
                (int) $rows->sum('meetings'),

            'quotations' =>
                (int) $rows->sum('quotations'),

            'total_activities' =>
                (int) $rows->sum(
                    'total_activities'
                ),

            'assigned_leads' =>
                $assignedLeads,

            'responded_within_sla' =>
                $withinSla,

            'sla_rate' =>
                $assignedLeads > 0
                    ? round(
                        (
                            $withinSla
                            / $assignedLeads
                        ) * 100,
                        2
                    )
                    : 0,
        ];
    }

    private function getTeamMembers(
        User $teamLeader,
        Carbon $start,
        Carbon $end,
        ?int $userId
    ): Collection {
        $activityUserIds = SalesActivity::query()
            ->where(
                'team_leader_id',
                $teamLeader->id
            )
            ->whereBetween(
                'occurred_at',
                [
                    $start->copy()->startOfDay(),
                    $end->copy()->endOfDay(),
                ]
            )
            ->pluck('user_id');

        $leadUserIds = Lead::query()
            ->where(
                'team_leader_id',
                $teamLeader->id
            )
            ->whereNotNull('assigned_to')
            ->whereBetween(
                'assigned_at',
                [
                    $start->copy()->startOfDay(),
                    $end->copy()->endOfDay(),
                ]
            )
            ->pluck('assigned_to');

        $ids = $activityUserIds
            ->merge($leadUserIds)
            ->unique()
            ->values();

        $query = User::query()
            ->whereIn(
                'id',
                $ids
            );

        if ($userId !== null) {
            $query->where(
                'id',
                $userId
            );
        }

        return $query
            ->orderBy('name')
            ->get();
    }

    private function resolveRange(
        ?string $dateFrom,
        ?string $dateTo
    ): array {
        if (
            $dateFrom !== null
            && $dateTo !== null
        ) {
            return [
                Carbon::parse(
                    $dateFrom
                )->startOfDay(),

                Carbon::parse(
                    $dateTo
                )->endOfDay(),
            ];
        }

        return [
            now()->startOfWeek(
                Carbon::MONDAY
            ),

            now()->endOfWeek(
                Carbon::SUNDAY
            ),
        ];
    }
}