<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quote\UpdateQuoteDiscountRequest;
use App\Models\Quote;
use App\Services\QuoteService;
use Illuminate\Http\JsonResponse;

class QuoteController extends Controller
{
    public function __construct(
        private readonly QuoteService $quoteService
    ) {
    }

    public function updateDiscount(
        UpdateQuoteDiscountRequest $request,
        Quote $quote
    ): JsonResponse {
        $currentUser = $request->attributes->get('current_user');

        if (!$currentUser) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Phiên đăng nhập không hợp lệ.',
            ], 401);
        }

        $updatedQuote = $this->quoteService->updateDiscount(
            $quote,
            (float) $request->validated('discount'),
            $currentUser
        );

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $updatedQuote->id,
                'name' => $updatedQuote->name,
                'discount' => $updatedQuote->discount,
            ],
            'message' => 'Cập nhật chiết khấu thành công.',
        ]);
    }
}