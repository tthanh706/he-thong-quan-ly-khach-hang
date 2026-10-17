<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOpportunityStageSlaConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'inactivity_days' => [
                'required',
                'integer',
                'min:1',
                'max:365',
            ],
            'is_active' => [
                'required',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'inactivity_days.required' => 'Vui lòng nhập số ngày.',
            'inactivity_days.min' => 'Số ngày phải lớn hơn hoặc bằng 1.',
        ];
    }
}