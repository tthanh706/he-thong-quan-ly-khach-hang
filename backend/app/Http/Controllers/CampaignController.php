<?php

namespace App\Http\Controllers;

use App\Http\Requests\CampaignRequest;
use App\Models\Campaign;
use App\Services\CampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    protected CampaignService $campaignService;

    public function __construct(CampaignService $campaignService)
    {
        $this->campaignService = $campaignService;
    }

    /**
     * Display a listing of campaigns.
     */
    public function index(Request $request): JsonResponse
    {
        $campaigns = $this->campaignService->getAllCampaigns(
            $request->only(['search', 'status']),
            (int) $request->get('per_page', 15)
        );

        return response()->json([
            'status' => 'success',
            'data' => $campaigns,
        ]);
    }

    /**
     * Store a newly created campaign.
     */
    public function store(CampaignRequest $request): JsonResponse
    {
        $data = $request->validated();
        if ($request->user()) {
            $data['user_id'] = $request->user()->id;
        }

        $campaign = $this->campaignService->createCampaign($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Tạo chiến dịch thành công.',
            'data' => $campaign,
        ], 201);
    }

    /**
     * Display the specified campaign.
     */
    public function show(Campaign $campaign): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $campaign,
        ]);
    }

    /**
     * Update the specified campaign.
     */
    public function update(CampaignRequest $request, Campaign $campaign): JsonResponse
    {
        $updatedCampaign = $this->campaignService->updateCampaign($campaign, $request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật chiến dịch thành công.',
            'data' => $updatedCampaign,
        ]);
    }

    /**
     * Remove the specified campaign.
     */
    public function destroy(Campaign $campaign): JsonResponse
    {
        $this->campaignService->deleteCampaign($campaign);

        return response()->json([
            'status' => 'success',
            'message' => 'Xóa chiến dịch thành công.',
        ]);
    }
}
