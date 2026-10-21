<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\OpportunityMember\AddOpportunityMemberRequest;
use App\Http\Requests\OpportunityMember\TransferOwnershipRequest;
use App\Http\Resources\OpportunityMemberResource;
use App\Http\Resources\OpportunityOwnershipLogResource;
use App\Http\Resources\OpportunityResource; // Giả sử đã có
use App\Models\Opportunity;
use App\Services\OpportunityMemberService;
use Illuminate\Http\JsonResponse;

class OpportunityMemberController extends Controller
{
    public function __construct(
        private readonly OpportunityMemberService $opportunityMemberService
    ) {}

    /**
     * GET /api/v1/opportunities/{opportunity}/members
     */
    public function index(Opportunity $opportunity): JsonResponse
    {
        $this->authorize('view', $opportunity);

        $members = $this->opportunityMemberService->getMembers($opportunity);

        return response()->json([
            'success' => true,
            'data' => OpportunityMemberResource::collection($members),
            'message' => 'Danh sách thành viên cùng theo dõi cơ hội',
        ]);
    }

    /**
     * POST /api/v1/opportunities/{opportunity}/members
     */
    public function store(AddOpportunityMemberRequest $request, Opportunity $opportunity): JsonResponse
    {
        $member = $this->opportunityMemberService->addMember(
            $opportunity,
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new OpportunityMemberResource($member),
            'message' => 'Thêm thành viên thành công',
        ], 201);
    }

    /**
     * DELETE /api/v1/opportunities/{opportunity}/members/{userId}
     */
    public function destroy(Opportunity $opportunity, int $userId): JsonResponse
    {
        $this->authorize('manageMembers', $opportunity);

        $this->opportunityMemberService->removeMember($opportunity, $userId);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Xóa thành viên thành công',
        ]);
    }

    /**
     * POST /api/v1/opportunities/{opportunity}/transfer-ownership
     */
    public function transferOwnership(
        TransferOwnershipRequest $request,
        Opportunity $opportunity
    ): JsonResponse {
        $data = $request->validated();

        $updated = $this->opportunityMemberService->transferOwnership(
            $opportunity,
            $data['new_owner_id'],
            $request->user(),
            $data['note'] ?? null,
            $data['keep_as_member'] ?? true
        );

        return response()->json([
            'success' => true,
            'data' => new OpportunityResource($updated),
            'message' => 'Chuyển quyền sở hữu thành công. Đã ghi nhật ký.',
        ]);
    }

    /**
     * GET /api/v1/opportunities/{opportunity}/ownership-logs
     */
    public function ownershipLogs(Opportunity $opportunity): JsonResponse
    {
        $this->authorize('view', $opportunity);

        $logs = $this->opportunityMemberService->getOwnershipLogs($opportunity);

        return response()->json([
            'success' => true,
            'data' => OpportunityOwnershipLogResource::collection($logs),
            'message' => 'Lịch sử chuyển quyền sở hữu',
        ]);
    }
}