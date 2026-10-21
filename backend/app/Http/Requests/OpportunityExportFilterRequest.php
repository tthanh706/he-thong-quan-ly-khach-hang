<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OpportunityExportFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stage' => [
                'nullable',
                'string',
                'max:80',
            ],

            'status' => [
                'nullable',
                'string',
                'max:50',
            ],

            'owner_user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],

            'search' => [
                'nullable',
                'string',
                'max:180',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'owner_user_id.exists' =>
                'Nhân viên phụ trách không tồn tại.',

            'date_to.after_or_equal' =>
                'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
        ];
    }
}