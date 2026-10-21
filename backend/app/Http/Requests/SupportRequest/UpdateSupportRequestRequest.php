<?php

namespace App\Http\Requests\SupportRequest;

use App\Enums\SupportPriorityEnum;
use App\Enums\SupportStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupportRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subject' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'priority' => ['sometimes', Rule::enum(SupportPriorityEnum::class)],
            'status' => ['sometimes', Rule::enum(SupportStatusEnum::class)],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'resolution_note' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'subject.max' => 'Tiêu đề không được vượt quá 255 ký tự.',
            'priority.enum' => 'Mức độ ưu tiên không hợp lệ.',
            'status.enum' => 'Trạng thái không hợp lệ.',
            'assignee_id.exists' => 'Nhân viên được phân công không tồn tại.',
        ];
    }
}
