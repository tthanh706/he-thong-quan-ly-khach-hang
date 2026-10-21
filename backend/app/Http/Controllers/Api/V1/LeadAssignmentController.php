<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AcceptLeadRequest;
use App\Http\Requests\ContactLeadRequest;
use App\Http\Requests\FilterLeadRequest;
use App\Http\Requests\RejectLeadRequest;
use App\Http\Resources\LeadAssignmentHistoryResource;
use App\Http\Resources\LeadResource;
use App\Http\Resources\LeadSlaAlertResource;
use App\Models\Lead;
use App\Models\User;
use App\Services\LeadAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class LeadAssignmentController extends Controller
{
    public function __construct(
        private readonly LeadAssignmentService $leadAssignmentService
    ) {
    }

    public function index(
        FilterLeadRequest $request
    ): JsonResponse {
        $leads = $this->leadAssignmentService
            ->getLeads($request->validated());

        return response()->json([
            'success' => true,
            'data' => LeadResource::collection(
                $leads->items()
            ),
            'meta' => [
                'current_page' => $leads->currentPage(),
                'last_page' => $leads->lastPage(),
                'per_page' => $leads->perPage(),
                'total' => $leads->total(),
            ],
            'message' => 'Lấy danh sách lead thành công.',
        ]);
    }

    public function show(
        Lead $lead
    ): JsonResponse {
        $lead->load([
            'assignedUser',
            'teamLeader',
        ]);

        return response()->json([
            'success' => true,
            'data' => new LeadResource($lead),
            'message' => 'Lấy thông tin lead thành công.',
        ]);
    }

    public function assign(
        Request $request,
        Lead $lead
    ): JsonResponse {
        $validated = $request->validate([
            'assigned_to' => [
                'required',
                'integer',
                'exists:users,id',
            ],
            'team_leader_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
        ]);

        $assignedUser = User::findOrFail(
            $validated['assigned_to']
        );

        $teamLeader = isset(
            $validated['team_leader_id']
        )
            ? User::findOrFail(
                $validated['team_leader_id']
            )
            : null;

        $lead = $this->leadAssignmentService
            ->assignLead(
                $lead,
                $assignedUser,
                $teamLeader
            );

        return response()->json([
            'success' => true,
            'data' => new LeadResource($lead),
            'message' => 'Phân lead thành công.',
        ]);
    }

    public function accept(
        AcceptLeadRequest $request,
        Lead $lead
    ): JsonResponse {
        try {
            $user = $request->attributes->get(
                'current_user'
            );

            $lead = $this->leadAssignmentService
                ->acceptLead($lead, $user);

            return response()->json([
                'success' => true,
                'data' => new LeadResource($lead),
                'message' =>
                    'Nhận lead thành công. Lead đã chuyển sang trạng thái đang chăm sóc.',
            ]);
        } catch (InvalidArgumentException $exception) {
            return $this->businessError($exception);
        }
    }

    public function reject(
        RejectLeadRequest $request,
        Lead $lead
    ): JsonResponse {
        try {
            $user = $request->attributes->get(
                'current_user'
            );

            $lead = $this->leadAssignmentService
                ->rejectLead(
                    $lead,
                    $user,
                    $request->validated('reason')
                );

            return response()->json([
                'success' => true,
                'data' => new LeadResource($lead),
                'message' =>
                    'Từ chối lead thành công. Lead đã quay lại hàng chờ phân bổ.',
            ]);
        } catch (InvalidArgumentException $exception) {
            return $this->businessError($exception);
        }
    }

    public function contact(
        ContactLeadRequest $request,
        Lead $lead
    ): JsonResponse {
        try {
            $user = $request->attributes->get(
                'current_user'
            );

            $lead = $this->leadAssignmentService
                ->markContacted(
                    $lead,
                    $user,
                    $request->validated('contacted_at')
                );

            return response()->json([
                'success' => true,
                'data' => new LeadResource($lead),
                'message' =>
                    'Đã ghi nhận thời gian liên hệ khách hàng.',
            ]);
        } catch (InvalidArgumentException $exception) {
            return $this->businessError($exception);
        }
    }

    public function history(
        Lead $lead
    ): JsonResponse {
        $history = $this->leadAssignmentService
            ->getHistory($lead);

        return response()->json([
            'success' => true,
            'data' =>
                LeadAssignmentHistoryResource::collection(
                    $history
                ),
            'message' =>
                'Lấy lịch sử xử lý lead thành công.',
        ]);
    }

    public function checkSla(): JsonResponse
    {
        $count = $this->leadAssignmentService
            ->flagOverdueLeads();

        return response()->json([
            'success' => true,
            'data' => [
                'flagged_count' => $count,
            ],
            'message' =>
                'Kiểm tra lead quá SLA thành công.',
        ]);
    }

    public function slaAlerts(
        Request $request
    ): JsonResponse {
        $user = $request->attributes->get(
            'current_user'
        );

        $alerts = $this->leadAssignmentService
            ->getSlaAlerts($user?->id);

        return response()->json([
            'success' => true,
            'data' => LeadSlaAlertResource::collection(
                $alerts
            ),
            'message' =>
                'Lấy cảnh báo SLA thành công.',
        ]);
    }

    private function businessError(
        InvalidArgumentException $exception
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => $exception->getMessage(),
        ], 422);
    }
}