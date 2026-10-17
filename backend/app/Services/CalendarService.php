<?php

namespace App\Services;

use App\Enums\CalendarItemStatusEnum;
use App\Enums\CalendarItemTypeEnum;
use App\Models\CalendarItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CalendarService
{
    public function createMeeting(
        User $assignedUser,
        User $teamLeader,
        string $title,
        string $startAt,
        string $endAt,
        ?string $location = null,
        ?string $description = null
    ): CalendarItem {
        $start = Carbon::parse($startAt);
        $end = Carbon::parse($endAt);

        if ($end->lessThanOrEqualTo($start)) {
            throw new InvalidArgumentException(
                'Thời gian kết thúc phải sau thời gian bắt đầu.'
            );
        }

        if ($this->hasConflict(
            $assignedUser->id,
            $start,
            $end
        )) {
            throw new InvalidArgumentException(
                'Lịch họp bị trùng với một cuộc gặp đã có.'
            );
        }

        return DB::transaction(function () use (
            $assignedUser,
            $teamLeader,
            $title,
            $start,
            $end,
            $location,
            $description
        ): CalendarItem {
            return CalendarItem::create([
                'title' => $title,
                'item_type' => CalendarItemTypeEnum::MEETING,
                'assigned_user_id' => $assignedUser->id,
                'team_leader_id' => $teamLeader->id,
                'start_at' => $start,
                'end_at' => $end,
                'status' => CalendarItemStatusEnum::SCHEDULED,
                'location' => $location,
                'description' => $description,
            ]);
        });
    }

    public function createTask(
        User $assignedUser,
        User $teamLeader,
        string $title,
        string $dueAt,
        ?string $description = null
    ): CalendarItem {
        return CalendarItem::create([
            'title' => $title,
            'item_type' => CalendarItemTypeEnum::TASK,
            'assigned_user_id' => $assignedUser->id,
            'team_leader_id' => $teamLeader->id,
            'due_at' => Carbon::parse($dueAt),
            'status' => CalendarItemStatusEnum::SCHEDULED,
            'description' => $description,
        ]);
    }

    public function hasConflict(
        int $userId,
        Carbon $startAt,
        Carbon $endAt,
        ?int $ignoreItemId = null
    ): bool {
        return CalendarItem::query()
            ->where(
                'assigned_user_id',
                $userId
            )
            ->where(
                'item_type',
                CalendarItemTypeEnum::MEETING->value
            )
            ->where(
                'status',
                '!=',
                CalendarItemStatusEnum::CANCELLED->value
            )
            ->when(
                $ignoreItemId,
                fn ($query) =>
                    $query->where(
                        'id',
                        '!=',
                        $ignoreItemId
                    )
            )
            ->where(
                'start_at',
                '<',
                $endAt
            )
            ->where(
                'end_at',
                '>',
                $startAt
            )
            ->exists();
    }

    public function getMyCalendar(
        User $user,
        string $view,
        string $date
    ): Collection {
        [$start, $end] = $this->resolveRange(
            $view,
            $date
        );

        return $this->calendarQuery(
            $start,
            $end
        )
            ->where(
                'assigned_user_id',
                $user->id
            )
            ->get();
    }

    public function getTeamCalendar(
        User $teamLeader,
        string $view,
        string $date
    ): Collection {
        [$start, $end] = $this->resolveRange(
            $view,
            $date
        );

        return $this->calendarQuery(
            $start,
            $end
        )
            ->where(
                'team_leader_id',
                $teamLeader->id
            )
            ->get();
    }

    private function calendarQuery(
        Carbon $start,
        Carbon $end
    ) {
        return CalendarItem::query()
            ->with([
                'assignedUser',
                'teamLeader',
            ])
            ->where(function ($query) use (
                $start,
                $end
            ): void {
                $query
                    ->where(function ($meetingQuery) use (
                        $start,
                        $end
                    ): void {
                        $meetingQuery
                            ->where(
                                'item_type',
                                CalendarItemTypeEnum::MEETING->value
                            )
                            ->where(
                                'start_at',
                                '<=',
                                $end
                            )
                            ->where(
                                'end_at',
                                '>=',
                                $start
                            );
                    })
                    ->orWhere(function ($taskQuery) use (
                        $start,
                        $end
                    ): void {
                        $taskQuery
                            ->where(
                                'item_type',
                                CalendarItemTypeEnum::TASK->value
                            )
                            ->whereBetween(
                                'due_at',
                                [
                                    $start,
                                    $end,
                                ]
                            );
                    });
            })
            ->orderByRaw(
                'COALESCE(start_at, due_at) ASC'
            );
    }

    private function resolveRange(
        string $view,
        string $date
    ): array {
        $current = Carbon::parse($date);

        return match ($view) {
            'day' => [
                $current->copy()->startOfDay(),
                $current->copy()->endOfDay(),
            ],

            'month' => [
                $current->copy()->startOfMonth(),
                $current->copy()->endOfMonth(),
            ],

            default => [
                $current->copy()->startOfWeek(),
                $current->copy()->endOfWeek(),
            ],
        };
    }
}