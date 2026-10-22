<?php

namespace App\Repositories\Contracts;

interface LeadRepositoryInterface
{
    public function getAllWithPriority();
    public function updateScoreAndClassification($lead, int $score, string $classification);
}