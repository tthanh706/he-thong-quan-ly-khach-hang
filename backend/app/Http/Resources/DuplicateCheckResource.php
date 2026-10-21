<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DuplicateCheckResource extends JsonResource
{
    /**
     * This resource wraps the result of duplicate detection.
     * Expects the resource to be constructed from an associative array.
     */
    public function toArray(Request $request): array
    {
        return [
            'lead_id'             => $this->resource['lead_id'],
            'has_duplicates'      => $this->resource['duplicate_leads']->isNotEmpty(),
            'duplicate_leads'     => LeadResource::collection($this->resource['duplicate_leads']),
            'has_matching_customers' => $this->resource['matching_customers']->isNotEmpty(),
            'matching_customers'  => $this->resource['matching_customers']->map(fn($c) => [
                'id'           => $c->id,
                'company_name' => $c->company_name,
                'email'        => $c->email,
                'phone_number' => $c->phone_number,
            ]),
            'suggestion'          => $this->buildSuggestion(),
        ];
    }

    private function buildSuggestion(): string
    {
        $dupeCount     = $this->resource['duplicate_leads']->count();
        $customerCount = $this->resource['matching_customers']->count();

        if ($customerCount > 0 && $dupeCount > 0) {
            return "Tìm thấy {$dupeCount} lead trùng lặp và {$customerCount} khách hàng phù hợp. Gợi ý: Gắn lead vào hồ sơ khách hàng hiện tại hoặc gộp với lead trùng.";
        }

        if ($customerCount > 0) {
            return "Tìm thấy {$customerCount} khách hàng phù hợp. Gợi ý: Gắn lead vào hồ sơ khách hàng hiện tại.";
        }

        if ($dupeCount > 0) {
            return "Tìm thấy {$dupeCount} lead trùng lặp. Gợi ý: Xem xét gộp các lead trùng.";
        }

        return 'Không phát hiện trùng lặp.';
    }
}
