<?php

namespace App\Repositories\Eloquent;

use App\Models\Lead;
use App\Repositories\Contracts\LeadRepositoryInterface;

class LeadRepository implements LeadRepositoryInterface
{
    public function getAllWithPriority()
    {
        // Sắp xếp ưu tiên lead có điểm cao nhất trước để nhân viên gọi
        return Lead::orderBy('score', 'desc')->orderBy('created_at', 'desc')->paginate(15);
    }

    public function updateScoreAndClassification($lead, int $score, string $classification)
    {
        $lead->update([
            'score' => $score,
            'classification' => $classification,
        ]);
        return $lead;
    }
}