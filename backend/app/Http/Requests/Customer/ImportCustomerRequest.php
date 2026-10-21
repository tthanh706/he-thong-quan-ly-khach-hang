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
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Vui lòng chọn file Excel để import.',
            'file.mimes' => 'Định dạng file không hợp lệ. Chỉ chấp nhận xlsx, xls, csv.',
            'file.max' => 'Dung lượng file không được vượt quá 10MB.',
        ];
    }
}
