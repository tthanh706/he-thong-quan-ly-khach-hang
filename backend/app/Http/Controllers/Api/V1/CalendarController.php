<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\FilterCalendarRequest;
use App\Http\Requests\StoreCalendarTaskRequest;
use App\Http\Requests\StoreMeetingRequest;
use App\Http\Resources\CalendarItemResource;
use App\Models\User;
use App\Services\CalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class CalendarController extends Controller
{
    public function myCalendar(
        FilterCalendarRequest $request,
        CalendarService $service
    ): JsonResponse {
        $user = $request->attributes->get(
            'current_user'
        );

        $data = $request->validated();

        $items = $service->getMyCalendar(
            $user,
            $data['view'],
            $data['date']
        );

        return response()->json([
            'success' => true,
            'data' => CalendarItemResource::collection(
                $items
            ),
            'message' => 'Lấy lịch cá nhân thành công.',
        ]);
    }

    public function teamCalendar(
        FilterCalendarRequest $request,
        CalendarService $service
    ): JsonResponse {
        $user = $request->attributes->get(
            'current_user'
        );

        $data = $request->validated();

        $items = $service->getTeamCalendar(
            $user,
            $data['view'],
            $data['date']
        );

        return response()->json([
            'success' => true,
            'data' => CalendarItemResource::collection(
                $items
            ),
            'message' => 'Lấy lịch nhóm thành công.',
        ]);
    }

    public function createMeeting(
        StoreMeetingRequest $request,
        CalendarService $service
    ): JsonResponse {
        $data = $request->validated();

        $assignedUser = User::findOrFail(
            $data['assigned_user_id']
        );

        $teamLeader = User::findOrFail(
            $data['team_leader_id']
        );

        try {
            $item = $service->createMeeting(
                $assignedUser,
                $teamLeader,
                $data['title'],
                $data['start_at'],
                $data['end_at'],
                $data['location'] ?? null,
                $data['description'] ?? null
            );
        } catch (InvalidArgumentException $exception) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => $exception->getMessage(),
            ], 422);
        }

        $item->load([
            'assignedUser',
            'teamLeader',
        ]);

        return response()->json([
            'success' => true,
            'data' => new CalendarItemResource(
                $item
            ),
            'message' => 'Tạo cuộc gặp thành công.',
        ], 201);
    }

    public function createTask(
        StoreCalendarTaskRequest $request,
        CalendarService $service
    ): JsonResponse {
        $data = $request->validated();

        $assignedUser = User::findOrFail(
            $data['assigned_user_id']
        );

        $teamLeader = User::findOrFail(
            $data['team_leader_id']
        );

        $item = $service->createTask(
            $assignedUser,
            $teamLeader,
            $data['title'],
            $data['due_at'],
            $data['description'] ?? null
        );

        $item->load([
            'assignedUser',
            'teamLeader',
        ]);

        return response()->json([
            'success' => true,
            'data' => new CalendarItemResource(
                $item
            ),
            'message' => 'Tạo công việc thành công.',
        ], 201);
    }

    public function users(Request $request): JsonResponse
    {
        $currentUser = $request->attributes->get(
            'current_user'
        );

        $query = User::query()
            ->select([
                'id',
                'name',
                'email',
                'role',
            ]);

        if ($currentUser?->role === 'team_leader') {
            $query->whereIn(
                'role',
                [
                    'staff',
                    'team_leader',
                ]
            );
        } else {
            $query->where(
                'id',
                $currentUser->id
            );
        }

        return response()->json([
            'success' => true,
            'data' => $query
                ->orderBy('name')
                ->get(),
            'message' => 'Lấy danh sách người dùng thành công.',
        ]);
    }
}