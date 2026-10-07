<?php

namespace App\Http\Controllers;

use App\Models\HandoverLog;
use Illuminate\Http\JsonResponse;

class HandoverLogController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => HandoverLog::with([
                'sourceUser:id,name,email',
                'targetUser:id,name,email',
                'performedBy:id,name,email',
            ])->latest('handed_over_at')->limit(200)->get(),
        ]);
    }
}
