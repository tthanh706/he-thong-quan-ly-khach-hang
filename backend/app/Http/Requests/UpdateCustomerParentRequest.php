<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerParentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'parent_customer_id' => [
                'nullable',
                'integer',
                'exists:customers,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'parent_customer_id.integer' =>
                'ID công ty mẹ phải là số nguyên.',
            'parent_customer_id.exists' =>
                'Công ty mẹ không tồn tại.',
        ];
    }
}