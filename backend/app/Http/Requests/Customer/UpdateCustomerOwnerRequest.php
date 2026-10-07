<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerOwnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'owner_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'owner_id.required' =>
                'Vui lòng chọn người sở hữu.',

            'owner_id.integer' =>
                'Người sở hữu không hợp lệ.',

            'owner_id.exists' =>
                'Không tìm thấy người dùng.',
        ];
    }
}