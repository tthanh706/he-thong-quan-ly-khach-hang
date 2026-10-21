<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Campaign\CreateCampaignRequest;
use App\Http\Requests\Campaign\UpdateCampaignRequest;
use App\Http\Resources\CampaignCollection;
use App\Http\Resources\CampaignResource;
use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function __construct(
        private readonly CampaignService $campaignService
    ) {}

    /**
     * GET /api/v1/campaigns
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Campaign::class);

        $campaigns = $this->campaignService->list(
            $request->user(),
            $request->only(['status', 'channel', 'search', 'sort_by', 'sort_order', 'per_page'])
        );

        return response()->json([
            'success' => true,
            'data' => new CampaignCollection($campaigns),
            'message' => 'Danh sách chiến dịch',
        ]);
    }

    /**
     * GET /api/v1/campaigns/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $campaign = $this->campaignService->findById($id, $request->user());
        $this->authorize('view', $campaign);

        return response()->json([
            'success' => true,
            'data' => new CampaignResource($campaign),
            'message' => 'Chi tiết chiến dịch',
        ]);
    }

    /**
     * POST /api/v1/campaigns
     */
    public function store(CreateCampaignRequest $request): JsonResponse
    {
        $campaign = $this->campaignService->create(
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new CampaignResource($campaign->load('owner')),
            'message' => 'Tạo chiến dịch thành công',
        ], 201);
    }

    /**
     * PATCH /api/v1/campaigns/{id}
     */
    public function update(UpdateCampaignRequest $request, Campaign $campaign): JsonResponse
    {
        $this->authorize('update', $campaign);

        $updated = $this->campaignService->update($campaign, $request->validated());

        return response()->json([
            'success' => true,
            'data' => new CampaignResource($updated->load('owner')),
            'message' => 'Cập nhật chiến dịch thành công',
        ]);
    }

    /**
     * DELETE /api/v1/campaigns/{id}
     */
    public function destroy(Campaign $campaign): JsonResponse
    {
        $this->authorize('delete', $campaign);

        $this->campaignService->delete($campaign);

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Xóa chiến dịch thành công',
        ]);
    }

    /**
     * GET /api/v1/campaigns/performance
     * Báo cáo hiệu quả chiến dịch (lead, opportunity, closed value)
     */
    public function performance(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Campaign::class);

        $report = $this->campaignService->getPerformanceReport(
            $request->user(),
            $request->only(['from_date', 'to_date', 'per_page'])
        );

        return response()->json([
            'success' => true,
            'data' => new CampaignCollection($report),
            'message' => 'Báo cáo hiệu quả chiến dịch',
        ]);
    }
}