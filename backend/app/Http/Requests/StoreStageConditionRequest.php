<?php

namespace App\Http\Requests;

use App\Models\StageTransitionCondition;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStageConditionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pipeline_stage_id' => ['required', 'integer', 'exists:pipeline_stages,id'],
            'condition_type'    => ['required', 'string', Rule::in(StageTransitionCondition::CONDITION_TYPES)],
            'parameters'        => ['required', 'array'],
            'error_message'     => ['required', 'string', 'max:500'],
            'is_active'         => ['nullable', 'boolean'],
            'priority'          => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'condition_type.in' => 'Loại điều kiện không hợp lệ. Hỗ trợ: ' . implode(', ', StageTransitionCondition::CONDITION_TYPES),
            'parameters.required' => 'Tham số điều kiện là bắt buộc.',
            'error_message.required' => 'Thông báo lỗi là bắt buộc.',
        ];
    }
}
