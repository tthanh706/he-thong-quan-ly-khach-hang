<?php

namespace App\Http\Requests\PeriodicCare;

use App\Enums\CareStatusEnum;
use App\Enums\CareTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePeriodicCareRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'care_type' => ['sometimes', Rule::enum(CareTypeEnum::class)],
            'scheduled_date' => ['sometimes', 'date'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['sometimes', Rule::enum(CareStatusEnum::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'care_type.enum' => 'Loại hình chăm sóc không hợp lệ.',
            'status.enum' => 'Trạng thái không hợp lệ.',
            'assignee_id.exists' => 'Nhân viên phụ trách không tồn tại.',
        ];
    }
}
