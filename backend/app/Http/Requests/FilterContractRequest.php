<?php

namespace App\Http\Requests;

use App\Enums\ContractStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterContractRequest extends FormRequest
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
                Rule::enum(ContractStatusEnum::class),
            ],
            'search' => [
                'nullable',
                'string',
                'max:180',
            ],
            'only_warning' => [
                'nullable',
                'boolean',
            ],
        ];
    }
}