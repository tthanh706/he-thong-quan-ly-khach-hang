<?php

namespace App\Http\Requests\CustomField;

use App\Enums\CustomFieldModuleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterCustomFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->attributes->get('current_user') !== null;
    }

    public function rules(): array
    {
        return [
            'module' => [
                'nullable',
                Rule::enum(CustomFieldModuleEnum::class),
            ],

            'is_active' => [
                'nullable',
                'boolean',
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