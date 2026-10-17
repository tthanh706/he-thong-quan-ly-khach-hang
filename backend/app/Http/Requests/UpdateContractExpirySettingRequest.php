<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContractExpirySettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warning_days' => [
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
            'warning_days.required' => 'Vui lòng nhập ngưỡng cảnh báo.',
            'warning_days.min' => 'Ngưỡng cảnh báo phải từ 1 ngày trở lên.',
        ];
    }
}