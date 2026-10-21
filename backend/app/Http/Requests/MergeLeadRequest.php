<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MergeLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'primary_lead_id'   => ['required', 'integer', 'exists:leads,id'],
            'secondary_lead_id' => ['required', 'integer', 'exists:leads,id', 'different:primary_lead_id'],
            'merge_reason'      => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'primary_lead_id.required'       => 'Lead chính là bắt buộc.',
            'secondary_lead_id.required'     => 'Lead phụ (cần gộp) là bắt buộc.',
            'secondary_lead_id.different'    => 'Không thể gộp lead với chính nó.',
            'primary_lead_id.exists'         => 'Lead chính không tồn tại.',
            'secondary_lead_id.exists'       => 'Lead phụ không tồn tại.',
        ];
    }
}
