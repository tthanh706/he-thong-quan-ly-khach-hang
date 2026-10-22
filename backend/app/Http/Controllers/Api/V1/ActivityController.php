<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Activity\CreateActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Services\ActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function __construct(protected ActivityService $activityService) {}

    public function index(Request $request): JsonResponse
    {
        $activities = $this->activityService->getPaginatedActivities($request->all());
        
        return response()->json([
            'success' => true,
            'data' => ActivityResource::collection($activities),
            'meta' => [
                'current_page' => $activities->currentPage(),
                'last_page' => $activities->lastPage(),
                'total' => $activities->total(),
            ]
        ]);
    }

    public function store(CreateActivityRequest $request): JsonResponse
    {
        $activity = $this->activityService->createActivity($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Ghi nhận hoạt động thành công!',
            'data' => new ActivityResource($activity->load(['user', 'customer', 'contact', 'opportunity']))
        ], 201);
    }

    public function destroy(Activity $activity): JsonResponse
    {
        $this->activityService->deleteActivity($activity);

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa nhật ký hoạt động.'
        ]);
    }
}