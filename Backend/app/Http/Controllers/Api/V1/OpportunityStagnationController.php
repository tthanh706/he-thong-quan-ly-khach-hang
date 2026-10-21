<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\FilterOpportunityRequest;
use App\Http\Requests\StoreOpportunityActivityRequest;
use App\Http\Requests\UpdateOpportunityStageSlaConfigRequest;
use App\Http\Resources\OpportunityActivityResource;
use App\Http\Resources\OpportunityResource;
use App\Http\Resources\OpportunityStagnationAlertResource;
use App\Models\Opportunity;
use App\Models\OpportunityStageSlaConfig;
use App\Services\OpportunityStagnationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OpportunityStagnationController extends Controller
{
    public function index(
        FilterOpportunityRequest $request
    ): JsonResponse {
        $user = $request->attributes->get('current_user');

        $query = Opportunity::query()
            ->with([
                'owner',
                'teamLeader',
            ]);

        if ($user?->role === 'team_leader') {
            $query->where(
                'team_leader_id',
                $user->id
            );
        }

        $filters = $request->validated();

        if (!empty($filters['status'])) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        if (!empty($filters['stage'])) {
            $query->where(
                'stage',
                $filters['stage']
            );
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(
                'name',
                'like',
                "%{$search}%"
            );
        }

        if (!empty($filters['only_problem'])) {
            $query->where(function ($query): void {
                $query
                    ->whereNotNull(
                        'stagnation_flagged_at'
                    )
                    ->orWhereNotNull(
                        'overdue_close_flagged_at'
                    );
            });
        }

        return response()->json([
            'success' => true,
            'data' => OpportunityResource::collection(
                $query
                    ->latest()
                    ->get()
            ),
            'message' => 'Lấy danh sách cơ hội thành công.',
        ]);
    }

    public function show(
        Opportunity $opportunity
    ): JsonResponse {
        $opportunity->load([
            'owner',
            'teamLeader',
        ]);

        return response()->json([
            'success' => true,
            'data' => new OpportunityResource(
                $opportunity
            ),
            'message' => 'Lấy thông tin cơ hội thành công.',
        ]);
    }

    public function addActivity(
        StoreOpportunityActivityRequest $request,
        Opportunity $opportunity,
        OpportunityStagnationService $service
    ): JsonResponse {
        $user = $request->attributes->get(
            'current_user'
        );

        $data = $request->validated();

        $activity = $service->addActivity(
            $opportunity,
            $user,
            $data['type'],
            $data['note'] ?? null,
            $data['activity_at'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => new OpportunityActivityResource(
                $activity
            ),
            'message' => 'Ghi nhận hoạt động thành công.',
        ]);
    }

    public function check(
        OpportunityStagnationService $service
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $service->checkOpportunities(),
            'message' => 'Kiểm tra cảnh báo thành công.',
        ]);
    }

    public function alerts(
        Request $request,
        OpportunityStagnationService $service
    ): JsonResponse {
        $user = $request->attributes->get(
            'current_user'
        );

        $alerts = $service
            ->getAlertsForTeamLeader($user);

        return response()->json([
            'success' => true,
            'data' => OpportunityStagnationAlertResource::collection(
                $alerts
            ),
            'message' => 'Lấy danh sách cảnh báo thành công.',
        ]);
    }

    public function problems(
        Request $request,
        OpportunityStagnationService $service
    ): JsonResponse {
        $user = $request->attributes->get(
            'current_user'
        );

        $opportunities = $service
            ->getProblemOpportunitiesForTeamLeader(
                $user
            );

        return response()->json([
            'success' => true,
            'data' => OpportunityResource::collection(
                $opportunities
            ),
            'message' => 'Lấy danh sách cơ hội cần chú ý thành công.',
        ]);
    }

    public function configs(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => OpportunityStageSlaConfig::query()
                ->orderBy('stage')
                ->get(),
            'message' => 'Lấy cấu hình cảnh báo thành công.',
        ]);
    }

    public function updateConfig(
        UpdateOpportunityStageSlaConfigRequest $request,
        OpportunityStageSlaConfig $config
    ): JsonResponse {
        $config->update(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'data' => $config->fresh(),
            'message' => 'Cập nhật cấu hình thành công.',
        ]);
    }
}