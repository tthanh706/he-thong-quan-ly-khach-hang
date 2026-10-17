<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransferContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'new_customer_id' => [
                'required',
                'integer',
                'exists:customers,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'new_customer_id.required' =>
                'Vui lòng chọn khách hàng mới.',
            'new_customer_id.exists' =>
                'Khách hàng mới không tồn tại.',
        ];
    }
}