<?php

namespace App\Http\Requests\SalesTarget;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSalesTargetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_value' => [
                'required',
                'numeric',
                'min:0',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'target_value.required' =>
                'Vui lòng nhập chỉ tiêu.',

            'target_value.numeric' =>
                'Chỉ tiêu phải là số.',

            'target_value.min' =>
                'Chỉ tiêu không được nhỏ hơn 0.',
        ];
    }
}