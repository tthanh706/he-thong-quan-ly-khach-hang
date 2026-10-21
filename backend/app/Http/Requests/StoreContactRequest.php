<?php

namespace App\Http\Requests;

use App\Enums\ContactDecisionRoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => [
                'required',
                'integer',
                'exists:customers,id',
            ],
            'full_name' => [
                'required',
                'string',
                'max:150',
            ],
            'job_title' => [
                'nullable',
                'string',
                'max:150',
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
            ],
            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],
            'decision_role' => [
                'nullable',
                Rule::enum(ContactDecisionRoleEnum::class),
            ],
            'is_primary' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' =>
                'Vui lòng chọn khách hàng.',
            'customer_id.exists' =>
                'Khách hàng không tồn tại.',
            'full_name.required' =>
                'Vui lòng nhập họ tên người liên hệ.',
            'email.email' =>
                'Email không đúng định dạng.',
            'decision_role.enum' =>
                'Vai trò quyết định mua không hợp lệ.',
        ];
    }
}