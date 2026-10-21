<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransitionStageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_stage_id'  => ['required', 'integer', 'exists:pipeline_stages,id'],
            'is_override'      => ['nullable', 'boolean'],
            'override_reason'  => ['required_if:is_override,true', 'nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'target_stage_id.required'    => 'Giai đoạn đích là bắt buộc.',
            'target_stage_id.exists'      => 'Giai đoạn đích không tồn tại.',
            'override_reason.required_if' => 'Lý do ghi đè là bắt buộc khi thực hiện override.',
        ];
    }
}
