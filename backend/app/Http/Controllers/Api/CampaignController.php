<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCampaignRequest;
use App\Http\Requests\UpdateCampaignRequest;
use App\Services\CampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CampaignController (API)
 *
 * Tất cả lỗi 401 / 403 / 404 sẽ được Handler::renderJson() bắt
 * và trả về JSON có cấu trúc thống nhất (SCRUM-91).
 */
class CampaignController extends Controller
{
    public function __construct(private readonly CampaignService $campaignService) {}

    /** GET /api/campaigns */
    public function index(Request $request): JsonResponse
    {
        $campaigns = $this->campaignService->paginate(
            perPage: (int) $request->query('per_page', 15),
            filters: $request->only(['status', 'search', 'created_by']),
        );

        return response()->json([
            'success' => true,
            'data'    => $campaigns,
        ]);
    }

    /** GET /api/campaigns/{id} */
    public function show(int $id): JsonResponse
    {
        $campaign = $this->campaignService->findOrFail($id); // -> 404

        return response()->json([
            'success' => true,
            'data'    => $campaign->load('creator', 'customer'),
        ]);
    }

    /** POST /api/campaigns */
    public function store(StoreCampaignRequest $request): JsonResponse
    {
        $campaign = $this->campaignService->create(
            $request->validated(),
            $request->user()->id,
        );

        return response()->json([
            'success' => true,
            'data'    => $campaign,
            'message' => 'Chiến dịch đã được tạo thành công.',
        ], 201);
    }

    /** PUT /api/campaigns/{id} */
    public function update(UpdateCampaignRequest $request, int $id): JsonResponse
    {
        $campaign = $this->campaignService->update(
            $id,
            $request->validated(),
            $request->user()->id,   // -> 403 nếu không phải người tạo / admin
        );

        return response()->json([
            'success' => true,
            'data'    => $campaign,
            'message' => 'Cập nhật chiến dịch thành công.',
        ]);
    }

    /** PATCH /api/campaigns/{id}/status */
    public function changeStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:draft,active,paused,completed'],
        ]);

        $campaign = $this->campaignService->changeStatus(
            $id,
            $request->input('status'),
            $request->user()->id,
        );

        return response()->json([
            'success' => true,
            'data'    => $campaign,
            'message' => "Trạng thái đã chuyển sang [{$campaign->status}].",
        ]);
    }

    /** DELETE /api/campaigns/{id} */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->campaignService->delete($id, $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Chiến dịch đã được xóa.',
        ]);
    }
}
