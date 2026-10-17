<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SupportRequest\CreateSupportRequestRequest;
use App\Http\Requests\SupportRequest\UpdateSupportRequestRequest;
use App\Http\Resources\SupportRequestResource;
use App\Services\SupportRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportRequestController extends Controller
{
    public function __construct(
        private readonly SupportRequestService $supportRequestService
    ) {}

    /**
     * GET /api/v1/support-requests
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'status', 'priority', 'customer_id', 'search',
            'sort_by', 'sort_order', 'per_page', 'page',
        ]);

        $paginator = $this->supportRequestService->list($request->user(), $filters);

        return response()->json([
            'success' => true,
            'data' => SupportRequestResource::collection($paginator),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
            'message' => 'Lấy danh sách yêu cầu hỗ trợ thành công.',
        ]);
    }

    /**
     * GET /api/v1/support-requests/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $item = $this->supportRequestService->find($id, $request->user());

        return response()->json([
            'success' => true,
            'data' => new SupportRequestResource($item),
            'message' => 'Lấy chi tiết yêu cầu hỗ trợ thành công.',
        ]);
    }

    /**
     * POST /api/v1/support-requests
     */
    public function store(CreateSupportRequestRequest $request): JsonResponse
    {
        $item = $this->supportRequestService->create(
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new SupportRequestResource($item->load(['customer', 'assignee', 'creator'])),
            'message' => 'Tạo yêu cầu hỗ trợ thành công.',
        ], 201);
    }

    /**
     * PATCH /api/v1/support-requests/{id}
     */
    public function update(UpdateSupportRequestRequest $request, int $id): JsonResponse
    {
        $item = $this->supportRequestService->find($id, $request->user());
        $updated = $this->supportRequestService->update($item, $request->validated());

        return response()->json([
            'success' => true,
            'data' => new SupportRequestResource($updated),
            'message' => 'Cập nhật yêu cầu hỗ trợ thành công.',
        ]);
    }

    /**
     * POST /api/v1/support-requests/{id}/assign
     */
    public function assign(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'assignee_id' => ['required', 'integer', 'exists:users,id'],
        ], [
            'assignee_id.required' => 'Vui lòng chọn nhân viên phân công.',
            'assignee_id.exists' => 'Nhân viên không tồn tại.',
        ]);

        $item = $this->supportRequestService->find($id, $request->user());
        $updated = $this->supportRequestService->assign($item, $request->input('assignee_id'));

        return response()->json([
            'success' => true,
            'data' => new SupportRequestResource($updated),
            'message' => 'Phân công yêu cầu hỗ trợ thành công.',
        ]);
    }

    /**
     * GET /api/v1/support-requests/warnings
     * API cảnh báo (US-08):
     * - HIGH priority chưa xử lý quá X giờ (mặc định 24h)
     * - MEDIUM/LOW quá hạn (mặc định 72h)
     * - Chưa được phân công
     */
    public function warnings(Request $request): JsonResponse
    {
        $hoursHigh = (int) $request->input('hours_high', 24);
        $hoursNormal = (int) $request->input('hours_normal', 72);

        $result = $this->supportRequestService->getWarnings(
            $request->user(),
            $hoursHigh,
            $hoursNormal
        );

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $result['total'],
                'high_priority_overdue' => $result['high_priority_overdue'],
                'normal_overdue' => $result['normal_overdue'],
                'unassigned' => $result['unassigned'],
                'items' => SupportRequestResource::collection($result['items']),
            ],
            'message' => 'Lấy danh sách cảnh báo yêu cầu hỗ trợ thành công.',
        ]);
    }

    /**
     * DELETE /api/v1/support-requests/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $item = $this->supportRequestService->find($id, $request->user());
        $this->supportRequestService->delete($item);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Xóa yêu cầu hỗ trợ thành công.',
        ]);
    }
}
