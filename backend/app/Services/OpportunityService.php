<?php

namespace App\Services;

use App\Models\Opportunity;
use Illuminate\Support\Facades\DB;
use Exception;

class OpportunityService
{
    public function closeWon(Opportunity $opportunity, array $data, int $userId): Opportunity
    {
        if ($opportunity->is_locked) {
            throw new Exception("Cơ hội này đã được đóng trước đó.");
        }

        return DB::transaction(function () use ($opportunity, $data, $userId) {
            $opportunity->update([
                'status' => 'won',
                'actual_revenue' => $data['actual_revenue'],
                'actual_close_date' => $data['actual_close_date'],
                'is_locked' => true,
                'closed_at' => now(),
                'closed_by' => $userId,
            ]);

            // Logic tự động tính cộng dồn chỉ tiêu (KPI) doanh số cho người sở hữu (owner_id)
            $this->updateSalesQuota($opportunity->owner_id, $data['actual_revenue'], $data['actual_close_date']);

            return $opportunity;
        });
    }

    public function closeLost(Opportunity $opportunity, array $data, int $userId): Opportunity
    {
        if ($opportunity->is_locked) {
            throw new Exception("Cơ hội này đã được đóng trước đó.");
        }

        return $opportunity->update([
            'status' => 'lost',
            'loss_reason_id' => $data['loss_reason_id'],
            'loss_reason_note' => $data['loss_reason_note'] ?? null,
            'competitor_id' => $data['competitor_id'] ?? null,
            'competitor_name_custom' => $data['competitor_name_custom'] ?? null,
            'is_locked' => true,
            'closed_at' => now(),
            'closed_by' => $userId,
        ]);
    }

    public function reopen(Opportunity $opportunity, string $reopenReason): Opportunity
    {
        return DB::transaction(function () use ($opportunity, $reopenReason) {
            // Nếu trước đó đóng Thắng, trừ lại chỉ tiêu doanh số
            if ($opportunity->status === 'won') {
                $this->deductSalesQuota($opportunity->owner_id, $opportunity->actual_revenue, $opportunity->actual_close_date);
            }

            $opportunity->update([
                'status' => 'open',
                'is_locked' => false,
                'reopen_reason' => $reopenReason,
            ]);

            return $opportunity;
        });
    }

    private function updateSalesQuota($ownerId, $revenue, $closeDate) {
        // Code xử lý tính KPI doanh số...
    }

    private function deductSalesQuota($ownerId, $revenue, $closeDate) {
        // Code xử lý trừ lại KPI khi Reopen...
    }
}