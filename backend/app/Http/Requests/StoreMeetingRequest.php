<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assigned_user_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],
            'team_leader_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],
            'title' => [
                'required',
                'string',
                'max:180',
            ],
            'start_at' => [
                'required',
                'date',
            ],
            'end_at' => [
                'required',
                'date',
                'after:start_at',
            ],
            'location' => [
                'nullable',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'assigned_user_id.required' => 'Vui lòng chọn nhân viên.',
            'title.required' => 'Vui lòng nhập tiêu đề cuộc gặp.',
            'start_at.required' => 'Vui lòng chọn thời gian bắt đầu.',
            'end_at.required' => 'Vui lòng chọn thời gian kết thúc.',
            'end_at.after' => 'Thời gian kết thúc phải sau thời gian bắt đầu.',
        ];
    }
}