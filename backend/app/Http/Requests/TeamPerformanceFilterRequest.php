<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TeamPerformanceFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],

            'user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'date_from.date' =>
                'Ngày bắt đầu không hợp lệ.',

            'date_to.date' =>
                'Ngày kết thúc không hợp lệ.',

            'date_to.after_or_equal' =>
                'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',

            'user_id.exists' =>
                'Nhân viên không tồn tại.',
        ];
    }
}