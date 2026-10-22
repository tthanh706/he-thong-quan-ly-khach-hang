<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\LeadScoringService;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    protected LeadScoringService $leadScoringService;

    public function __construct(LeadScoringService $leadScoringService)
    {
        $this->leadScoringService = $leadScoringService;
    }

    public function index(Request $request)
    {
        // Sắp xếp ưu tiên lead có điểm cao nhất trước để nhân viên gọi
        $leads = Lead::orderBy('score', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $leads
        ]);
    }

    public function update(Request $request, Lead $lead)
    {
        $lead->update($request->all());

        // Tự động tính lại điểm khi thông tin lead thay đổi
        $this->leadScoringService->calculateAndUpdateScore($lead);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật lead thành công',
            'data' => $lead
        ]);
    }
}