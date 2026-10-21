<?php

namespace App\Http\Requests;

use App\Models\Lead;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name'    => ['required', 'string', 'max:255'],
            'last_name'     => ['required', 'string', 'max:255'],
            'email'         => ['nullable', 'email', 'max:255'],
            'phone_number'  => ['nullable', 'string', 'max:50'],
            'company_name'  => ['nullable', 'string', 'max:255'],
            'job_title'     => ['nullable', 'string', 'max:255'],
            'source'        => ['nullable', 'string', 'max:100'],
            'status'        => ['nullable', Rule::in(Lead::STATUSES)],
            'assigned_to'   => ['nullable', 'exists:users,id'],
            'custom_fields' => ['nullable', 'array'],
            'notes'         => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Tên là trường bắt buộc.',
            'last_name.required'  => 'Họ là trường bắt buộc.',
            'email.email'         => 'Email không hợp lệ.',
        ];
    }
}
