<?php

namespace App\Http\Requests\Opportunity;

use Illuminate\Foundation\Http\FormRequest;

class CloseOpportunityLostRequest extends FormRequest
{
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'loss_reason_id' => 'required|exists:loss_reasons,id',
            'loss_reason_note' => 'nullable|string|max:500',
            'competitor_id' => 'nullable|exists:competitors,id',
            'competitor_name_custom' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array {
        return [
            'loss_reason_id.required' => 'Vui lòng chọn lý do thua thương vụ.',
            'loss_reason_id.exists' => 'Lý do thua không hợp lệ.',
        ];
    }
}