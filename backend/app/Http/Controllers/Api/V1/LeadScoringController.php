<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\LeadScoringService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadScoringController extends Controller
{
    protected LeadScoringService $leadScoringService;

    public function __construct(LeadScoringService $leadScoringService)
    {
        $this->leadScoringService = $leadScoringService;
    }

    public function getConfig()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'configs' => DB::table('lead_scoring_configs')->get(),
                'thresholds' => DB::table('lead_scoring_thresholds')->get(),
            ]
        ]);
    }

    public function updateConfig(Request $request)
    {
        $validated = $request->validate([
            'configs' => 'required|array',
            'thresholds' => 'required|array',
        ]);

        DB::transaction(function () use ($validated) {
            DB::table('lead_scoring_configs')->delete();
            DB::table('lead_scoring_configs')->insert($validated['configs']);

            DB::table('lead_scoring_thresholds')->delete();
            DB::table('lead_scoring_thresholds')->insert($validated['thresholds']);
        });

        // Tính lại điểm toàn bộ hệ thống khi thay đổi cấu hình
        $this->leadScoringService->recalculateAllLeads();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật cấu hình chấm điểm thành công'
        ]);
    }
}