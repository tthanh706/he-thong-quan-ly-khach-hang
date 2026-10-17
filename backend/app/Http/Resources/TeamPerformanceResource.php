<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamPerformanceResource extends JsonResource
{
    public function toArray(
        Request $request
    ): array {
        return [
            'user_id' =>
                $this['user_id'],

            'name' =>
                $this['name'],

            'email' =>
                $this['email'],

            'calls' =>
                $this['calls'],

            'meetings' =>
                $this['meetings'],

            'quotations' =>
                $this['quotations'],

            'total_activities' =>
                $this['total_activities'],

            'assigned_leads' =>
                $this['assigned_leads'],

            'responded_leads' =>
                $this['responded_leads'],

            'responded_within_sla' =>
                $this['responded_within_sla'],

            'missed_sla' =>
                $this['missed_sla'],

            'sla_rate' =>
                $this['sla_rate'],
        ];
    }
}