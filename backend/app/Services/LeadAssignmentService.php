<?php

namespace App\Services;

use App\Enums\LeadAssignmentActionEnum;
use App\Enums\LeadStatusEnum;
use App\Models\Lead;
use App\Models\LeadAssignmentHistory;
use App\Models\LeadSlaAlert;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class LeadAssignmentService
{
    private int $slaMinutes = 60;

    public function getLeads(array $filters): LengthAwarePaginator
    {
        $query = Lead::query()
            ->with([
                'assignedUser',
                'teamLeader',
            ]);

        if (!empty($filters['status'])) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        if (!empty($filters['assigned_to'])) {
            $query->where(
                'assigned_to',
                $filters['assigned_to']
            );
        }

        if (!empty($filters['team_leader_id'])) {
            $query->where(
                'team_leader_id',
                $filters['team_leader_id']
            );
        }

        if (
            array_key_exists('sla_overdue', $filters)
            && $filters['sla_overdue']
        ) {
            $query
                ->whereNull('contacted_at')
                ->whereNotNull('sla_deadline')
                ->where(
                    'sla_deadline',
                    '<',
                    now()
                );
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(
                function ($builder) use ($search) {
                    $builder
                        ->where(
                            'name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'email',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'phone',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        return $query
            ->latest()
            ->paginate(
                $filters['per_page'] ?? 15
            );
    }

    public function assignLead(
        Lead $lead,
        User $assignedUser,
        ?User $teamLeader = null
    ): Lead {
        return DB::transaction(
            function () use (
                $lead,
                $assignedUser,
                $teamLeader
            ) {
                $oldStatus = $lead->status?->value;

                $assignedAt = now();

                $lead->update([
                    'assigned_to' => $assignedUser->id,
                    'team_leader_id' => $teamLeader?->id,
                    'status' => LeadStatusEnum::ASSIGNED,
                    'assigned_at' => $assignedAt,
                    'accepted_at' => null,
                    'contacted_at' => null,
                    'sla_deadline' => $assignedAt
                        ->copy()
                        ->addMinutes($this->slaMinutes),
                    'sla_flagged_at' => null,
                    'rejection_reason' => null,
                ]);

                LeadSlaAlert::query()
                    ->where('lead_id', $lead->id)
                    ->delete();

                $this->createHistory(
                    $lead,
                    $assignedUser,
                    LeadAssignmentActionEnum::ASSIGNED,
                    $oldStatus,
                    LeadStatusEnum::ASSIGNED->value
                );

                return $lead->fresh([
                    'assignedUser',
                    'teamLeader',
                ]);
            }
        );
    }

    public function acceptLead(
        Lead $lead,
        User $user
    ): Lead {
        $this->ensureAssignedToUser(
            $lead,
            $user
        );

        if (
            $lead->status !==
            LeadStatusEnum::ASSIGNED
        ) {
            throw new InvalidArgumentException(
                'Lead không ở trạng thái chờ nhận.'
            );
        }

        return DB::transaction(
            function () use ($lead, $user) {
                $oldStatus = $lead->status->value;

                $lead->update([
                    'status' => LeadStatusEnum::CARING,
                    'accepted_at' => now(),
                    'rejection_reason' => null,
                ]);

                $this->createHistory(
                    $lead,
                    $user,
                    LeadAssignmentActionEnum::ACCEPTED,
                    $oldStatus,
                    LeadStatusEnum::CARING->value
                );

                return $lead->fresh([
                    'assignedUser',
                    'teamLeader',
                ]);
            }
        );
    }

    public function rejectLead(
        Lead $lead,
        User $user,
        string $reason
    ): Lead {
        $this->ensureAssignedToUser(
            $lead,
            $user
        );

        if (
            $lead->status !==
            LeadStatusEnum::ASSIGNED
        ) {
            throw new InvalidArgumentException(
                'Chỉ lead đang chờ nhận mới có thể từ chối.'
            );
        }

        return DB::transaction(
            function () use (
                $lead,
                $user,
                $reason
            ) {
                $oldStatus = $lead->status->value;

                $lead->update([
                    'assigned_to' => null,
                    'status' =>
                        LeadStatusEnum::WAITING_ASSIGNMENT,
                    'assigned_at' => null,
                    'accepted_at' => null,
                    'sla_deadline' => null,
                    'sla_flagged_at' => null,
                    'rejection_reason' => $reason,
                ]);

                LeadSlaAlert::query()
                    ->where('lead_id', $lead->id)
                    ->delete();

                $this->createHistory(
                    $lead,
                    $user,
                    LeadAssignmentActionEnum::REJECTED,
                    $oldStatus,
                    LeadStatusEnum::WAITING_ASSIGNMENT->value,
                    $reason
                );

                return $lead->fresh([
                    'assignedUser',
                    'teamLeader',
                ]);
            }
        );
    }

    public function markContacted(
        Lead $lead,
        User $user,
        ?string $contactedAt = null
    ): Lead {
        $this->ensureAssignedToUser(
            $lead,
            $user
        );

        if (
            $lead->status !==
            LeadStatusEnum::CARING
        ) {
            throw new InvalidArgumentException(
                'Lead phải ở trạng thái đang chăm sóc trước khi ghi nhận liên hệ.'
            );
        }

        return DB::transaction(
            function () use (
                $lead,
                $user,
                $contactedAt
            ) {
                $lead->update([
                    'contacted_at' =>
                        $contactedAt ?? now(),
                ]);

                $this->createHistory(
                    $lead,
                    $user,
                    LeadAssignmentActionEnum::CONTACTED,
                    $lead->status->value,
                    $lead->status->value
                );

                return $lead->fresh([
                    'assignedUser',
                    'teamLeader',
                ]);
            }
        );
    }

    public function flagOverdueLeads(): int
    {
        $leads = Lead::query()
            ->whereIn('status', [
                LeadStatusEnum::ASSIGNED->value,
                LeadStatusEnum::CARING->value,
            ])
            ->whereNull('contacted_at')
            ->whereNotNull('sla_deadline')
            ->where(
                'sla_deadline',
                '<',
                now()
            )
            ->whereNull('sla_flagged_at')
            ->get();

        $count = 0;

        foreach ($leads as $lead) {
            DB::transaction(
                function () use (
                    $lead,
                    &$count
                ) {
                    $flaggedAt = now();

                    $lead->update([
                        'sla_flagged_at' => $flaggedAt,
                    ]);

                    LeadSlaAlert::firstOrCreate(
                        [
                            'lead_id' => $lead->id,
                        ],
                        [
                            'recipient_user_id' =>
                                $lead->team_leader_id,
                            'overdue_at' => $flaggedAt,
                        ]
                    );

                    LeadAssignmentHistory::create([
                        'lead_id' => $lead->id,
                        'user_id' => null,
                        'action' =>
                            LeadAssignmentActionEnum::SLA_OVERDUE,
                        'old_status' =>
                            $lead->status->value,
                        'new_status' =>
                            $lead->status->value,
                        'reason' =>
                            'Lead quá thời hạn SLA nhưng chưa được liên hệ.',
                    ]);

                    $count++;
                }
            );
        }

        return $count;
    }

    public function getHistory(Lead $lead)
    {
        return $lead
            ->histories()
            ->with('user')
            ->latest()
            ->get();
    }

    public function getSlaAlerts(
        ?int $recipientUserId = null
    ) {
        return LeadSlaAlert::query()
            ->with([
                'lead',
                'recipient',
            ])
            ->when(
                $recipientUserId,
                fn ($query) =>
                    $query->where(
                        'recipient_user_id',
                        $recipientUserId
                    )
            )
            ->latest('overdue_at')
            ->get();
    }

    private function ensureAssignedToUser(
        Lead $lead,
        User $user
    ): void {
        if ($lead->assigned_to !== $user->id) {
            throw new InvalidArgumentException(
                'Lead này không được phân cho bạn.'
            );
        }
    }

    private function createHistory(
        Lead $lead,
        ?User $user,
        LeadAssignmentActionEnum $action,
        ?string $oldStatus,
        ?string $newStatus,
        ?string $reason = null
    ): void {
        LeadAssignmentHistory::create([
            'lead_id' => $lead->id,
            'user_id' => $user?->id,
            'action' => $action,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'reason' => $reason,
        ]);
    }
}