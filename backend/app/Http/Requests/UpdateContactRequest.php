<?php

namespace App\Http\Requests;

use App\Enums\ContactDecisionRoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => [
                'sometimes',
                'required',
                'string',
                'max:150',
            ],
            'job_title' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
            ],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
            ],
            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
            ],
            'decision_role' => [
                'sometimes',
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
            'full_name.required' =>
                'Họ tên người liên hệ không được để trống.',
            'email.email' =>
                'Email không đúng định dạng.',
            'decision_role.enum' =>
                'Vai trò quyết định mua không hợp lệ.',
        ];
    }
}