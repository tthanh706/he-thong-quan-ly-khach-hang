<?php

namespace App\Http\Requests\Opportunity;

use Illuminate\Foundation\Http\FormRequest;

class ReopenOpportunityRequest extends FormRequest
{
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'reopen_reason' => 'required|string|min:10|max:1000',
        ];
    }

    public function messages(): array {
        return [
            'reopen_reason.required' => 'Vui lòng nhập lý do mở lại cơ hội.',
            'reopen_reason.min' => 'Lý do mở lại phải từ 10 ký tự trở lên.',
        ];
    }
}