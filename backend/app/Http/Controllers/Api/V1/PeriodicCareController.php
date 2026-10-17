<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PeriodicCare\CreatePeriodicCareRequest;
use App\Http\Requests\PeriodicCare\UpdatePeriodicCareRequest;
use App\Http\Resources\PeriodicCareResource;
use App\Services\PeriodicCareService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodicCareController extends Controller
{
    public function __construct(
        private readonly PeriodicCareService $periodicCareService
    ) {}

    /**
     * GET /api/v1/periodic-cares
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'status', 'care_type', 'customer_id', 'from_date', 'to_date',
            'search', 'warning_only', 'warning_days',
            'sort_by', 'sort_order', 'per_page', 'page',
        ]);

        $paginator = $this->periodicCareService->list($request->user(), $filters);

        return response()->json([
            'success' => true,
            'data' => PeriodicCareResource::collection($paginator),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
            'message' => 'Lấy danh sách lịch chăm sóc định kỳ thành công.',
        ]);
    }

    /**
     * GET /api/v1/periodic-cares/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $item = $this->periodicCareService->find($id, $request->user());

        return response()->json([
            'success' => true,
            'data' => new PeriodicCareResource($item),
            'message' => 'Lấy chi tiết lịch chăm sóc thành công.',
        ]);
    }

    /**
     * POST /api/v1/periodic-cares
     */
    public function store(CreatePeriodicCareRequest $request): JsonResponse
    {
        $item = $this->periodicCareService->create(
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new PeriodicCareResource($item->load(['customer', 'assignee', 'creator'])),
            'message' => 'Tạo lịch chăm sóc định kỳ thành công.',
        ], 201);
    }

    /**
     * PATCH /api/v1/periodic-cares/{id}
     */
    public function update(UpdatePeriodicCareRequest $request, int $id): JsonResponse
    {
        $item = $this->periodicCareService->find($id, $request->user());
        $updated = $this->periodicCareService->update($item, $request->validated());

        return response()->json([
            'success' => true,
            'data' => new PeriodicCareResource($updated),
            'message' => 'Cập nhật lịch chăm sóc thành công.',
        ]);
    }

    /**
     * POST /api/v1/periodic-cares/{id}/mark-done
     */
    public function markDone(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $item = $this->periodicCareService->find($id, $request->user());
        $updated = $this->periodicCareService->markDone($item, $request->input('notes'));

        return response()->json([
            'success' => true,
            'data' => new PeriodicCareResource($updated),
            'message' => 'Đánh dấu hoàn thành lịch chăm sóc thành công.',
        ]);
    }

    /**
     * GET /api/v1/periodic-cares/warnings
     * API hỗ trợ & cảnh báo (US-08)
     */
    public function warnings(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 7);
        $result = $this->periodicCareService->getWarnings($request->user(), $days);

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $result['total'],
                'overdue' => $result['overdue'],
                'upcoming' => $result['upcoming'],
                'items' => PeriodicCareResource::collection($result['items']),
            ],
            'message' => 'Lấy danh sách cảnh báo chăm sóc định kỳ thành công.',
        ]);
    }

    /**
     * DELETE /api/v1/periodic-cares/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $item = $this->periodicCareService->find($id, $request->user());
        $this->periodicCareService->delete($item);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Xóa lịch chăm sóc thành công.',
        ]);
    }
}
