<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Opportunity\CloseOpportunityWonRequest;
use App\Http\Requests\Opportunity\CloseOpportunityLostRequest;
use App\Http\Requests\Opportunity\ReopenOpportunityRequest;
use App\Models\Opportunity;
use App\Services\OpportunityService;
use Illuminate\Http\JsonResponse;

class OpportunityController extends Controller
{
    protected OpportunityService $opportunityService;

    public function __construct(OpportunityService $opportunityService)
    {
        $this->opportunityService = $opportunityService;
    }

    // POST /api/v1/opportunities/{id}/close-won
    public function closeWon(CloseOpportunityWonRequest $request, Opportunity $opportunity): JsonResponse
    {
        $updated = $this->opportunityService->closeWon($opportunity, $request->validated(), auth()->id());

        return response()->json([
            'success' => true,
            'message' => 'Đã đóng thắng cơ hội thành công!',
            'data' => $updated
        ]);
    }

    // POST /api/v1/opportunities/{id}/close-lost
    public function closeLost(CloseOpportunityLostRequest $request, Opportunity $opportunity): JsonResponse
    {
        $updated = $this->opportunityService->closeLost($opportunity, $request->validated(), auth()->id());

        return response()->json([
            'success' => true,
            'message' => 'Đã đóng thua cơ hội thành công!',
            'data' => $updated
        ]);
    }

    // POST /api/v1/opportunities/{id}/reopen
    public function reopen(ReopenOpportunityRequest $request, Opportunity $opportunity): JsonResponse
    {
        $this->authorize('reopen', $opportunity);

        $updated = $this->opportunityService->reopen($opportunity, $request->input('reopen_reason'));

        return response()->json([
            'success' => true,
            'message' => 'Đã mở lại cơ hội thành công.',
            'data' => $updated
        ]);
    }
}