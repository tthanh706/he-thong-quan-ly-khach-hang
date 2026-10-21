<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LinkLeadToCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'ID khách hàng là bắt buộc.',
            'customer_id.exists'   => 'Khách hàng không tồn tại trong hệ thống.',
        ];
    }
}
