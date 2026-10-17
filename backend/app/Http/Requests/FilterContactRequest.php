<?php

namespace App\Http\Requests;

use App\Enums\ContactDecisionRoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => [
                'nullable',
                'integer',
                'exists:customers,id',
            ],
            'decision_role' => [
                'nullable',
                Rule::enum(ContactDecisionRoleEnum::class),
            ],
            'is_primary' => [
                'nullable',
                'boolean',
            ],
            'search' => [
                'nullable',
                'string',
                'max:150',
            ],
            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }
}