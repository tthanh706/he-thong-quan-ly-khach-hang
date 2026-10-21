<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Enums\OpportunityStatusEnum;

class FilterOpportunityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'nullable',
                Rule::enum(OpportunityStatusEnum::class),
            ],
            'stage' => [
                'nullable',
                'string',
                'max:80',
            ],
            'search' => [
                'nullable',
                'string',
                'max:180',
            ],
            'only_problem' => [
                'nullable',
                'boolean',
            ],
        ];
    }
}