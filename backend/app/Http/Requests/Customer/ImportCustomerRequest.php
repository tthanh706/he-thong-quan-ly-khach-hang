<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class ImportCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'mimes:xlsx,xls',
                'max:10240', // 10MB
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Vui lòng chọn file Excel để import.',
            'file.file' => 'File không hợp lệ.',
            'file.mimes' => 'Chỉ hỗ trợ định dạng .xlsx hoặc .xls.',
            'file.max' => 'File không được vượt quá 10MB.',
        ];
    }
}
