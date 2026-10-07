<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SalesTarget\UpdateSalesTargetRequest;
use App\Models\SalesTarget;
use App\Services\SalesTargetService;
use Illuminate\Http\JsonResponse;

class SalesTargetController extends Controller
{
    public function __construct(
        private readonly SalesTargetService $salesTargetService
    ) {
    }

    public function update(
        UpdateSalesTargetRequest $request,
        SalesTarget $salesTarget
    ): JsonResponse {
        $currentUser = $request->attributes->get('current_user');

        if (!$currentUser) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Phiên đăng nhập không hợp lệ.',
            ], 401);
        }

        $updatedSalesTarget = $this->salesTargetService->updateTargetValue(
            $salesTarget,
            (float) $request->validated('target_value'),
            $currentUser
        );

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $updatedSalesTarget->id,
                'user_id' => $updatedSalesTarget->user_id,
                'target_value' => $updatedSalesTarget->target_value,
                'start_date' => $updatedSalesTarget->start_date?->toDateString(),
                'end_date' => $updatedSalesTarget->end_date?->toDateString(),
            ],
            'message' => 'Cập nhật chỉ tiêu thành công.',
        ]);
    }
}