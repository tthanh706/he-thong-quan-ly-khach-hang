<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role' => [
                'required',
                'string',
                'in:admin,manager,staff',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'role.required' =>
                'Vui lòng chọn vai trò.',

            'role.in' =>
                'Vai trò không hợp lệ.',
        ];
    }
}