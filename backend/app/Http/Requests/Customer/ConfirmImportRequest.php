<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.code' => ['required', 'string', 'max:50'],
            'rows.*.name' => ['required', 'string', 'max:255'],
            'rows.*.phone' => ['nullable', 'string', 'max:20'],
            'rows.*.email' => ['nullable', 'email', 'max:255'],
            'rows.*.tax_code' => ['nullable', 'string', 'max:50'],
            'rows.*.address' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'rows.required' => 'Không có dữ liệu để import.',
            'rows.min' => 'Phải có ít nhất 1 dòng dữ liệu hợp lệ.',
            'rows.*.code.required' => 'Mã khách hàng là bắt buộc.',
            'rows.*.name.required' => 'Tên khách hàng là bắt buộc.',
            'rows.*.email.email' => 'Email không đúng định dạng.',
        ];
    }
}
