<?php

namespace App\Http\Requests\AuditLog;

use Illuminate\Foundation\Http\FormRequest;

class FilterAuditLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'entity_type' => [
                'nullable',
                'string',
                'max:100',
            ],

            'from_date' => [
                'nullable',
                'date',
            ],

            'to_date' => [
                'nullable',
                'date',
                'after_or_equal:from_date',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.integer' =>
                'Người dùng không hợp lệ.',

            'user_id.exists' =>
                'Không tìm thấy người dùng.',

            'entity_type.string' =>
                'Loại đối tượng không hợp lệ.',

            'entity_type.max' =>
                'Loại đối tượng không được vượt quá 100 ký tự.',

            'from_date.date' =>
                'Ngày bắt đầu không hợp lệ.',

            'to_date.date' =>
                'Ngày kết thúc không hợp lệ.',

            'to_date.after_or_equal' =>
                'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',

            'per_page.integer' =>
                'Số bản ghi mỗi trang phải là số nguyên.',

            'per_page.min' =>
                'Số bản ghi mỗi trang phải lớn hơn 0.',

            'per_page.max' =>
                'Số bản ghi mỗi trang tối đa là 100.',
        ];
    }
}