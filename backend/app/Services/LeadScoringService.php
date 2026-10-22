<?php

namespace App\Services;

use App\Models\Lead;
use Illuminate\Support\Facades\DB;

class LeadScoringService
{
    public function calculateAndUpdateScore(Lead $lead): void
    {
        $configs = DB::table('lead_scoring_configs')->get()->groupBy('criteria_key');
        $totalScore = 0;

        $criterias = [
            'industry' => $lead->industry ?? null,
            'company_size' => $lead->company_size ?? null,
            'source' => $lead->source ?? null,
            'interest_level' => $lead->interest_level ?? null,
        ];

        foreach ($criterias as $key => $val) {
            if ($val && isset($configs[$key])) {
                $match = $configs[$key]->firstWhere('criteria_value', $val);
                if ($match) {
                    $totalScore += $match->score;
                }
            }
        }

        $classification = $this->determineClassification($totalScore);

        $lead->update([
            'score' => $totalScore,
            'classification' => $classification,
        ]);
    }

    public function recalculateAllLeads(): void
    {
        Lead::chunk(100, function ($leads) {
            foreach ($leads as $lead) {
                $this->calculateAndUpdateScore($lead);
            }
        });
    }

    private function determineClassification(int $score): string
    {
        $thresholds = DB::table('lead_scoring_thresholds')->get();

        foreach ($thresholds as $t) {
            if ($score >= $t->min_score && $score <= $t->max_score) {
                return $t->classification;
            }
        }

        if ($score >= 80) return 'Hot';
        if ($score >= 40) return 'Warm';
        return 'Cold';
    }
}