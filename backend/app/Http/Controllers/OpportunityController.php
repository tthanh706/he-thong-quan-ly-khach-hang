<?php

namespace App\Http\Controllers;

use App\Models\Opportunity;
use Illuminate\Http\JsonResponse;

class OpportunityController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Opportunity::with('owner:id,name,email')->latest()->get(),
        ]);
    }
}
