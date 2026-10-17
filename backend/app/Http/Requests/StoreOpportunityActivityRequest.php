<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOpportunityActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => [
                'required',
                'string',
                'max:50',
            ],
            'note' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'activity_at' => [
                'nullable',
                'date',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Vui lòng chọn loại hoạt động.',
            'activity_at.date' => 'Thời gian hoạt động không hợp lệ.',
        ];
    }
}