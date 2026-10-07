<?php

namespace App\Services;

use App\Models\Quote;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class QuoteService
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    ) {
    }

    public function updateDiscount(
        Quote $quote,
        float $newDiscount,
        User $currentUser
    ): Quote {
        return DB::transaction(function () use (
            $quote,
            $newDiscount,
            $currentUser
        ) {
            $oldDiscount = $quote->discount;

            if ((float) $oldDiscount === $newDiscount) {
                return $quote;
            }

            $quote->discount = $newDiscount;
            $quote->save();

            $this->auditLogService->logChange(
                $currentUser->id,
                'updated',
                'Quote',
                $quote->id,
                'discount',
                $oldDiscount,
                $newDiscount
            );

            return $quote->fresh();
        });
    }
}