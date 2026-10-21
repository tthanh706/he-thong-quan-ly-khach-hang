<?php

namespace App\Http\Requests\SupportRequest;

use App\Enums\SupportPriorityEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateSupportRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Kiểm tra quyền thực tế trong Policy / Controller
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'priority' => ['required', Rule::enum(SupportPriorityEnum::class)],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Vui lòng chọn khách hàng.',
            'customer_id.exists' => 'Khách hàng không tồn tại.',
            'subject.required' => 'Vui lòng nhập nội dung yêu cầu hỗ trợ.',
            'subject.max' => 'Tiêu đề không được vượt quá 255 ký tự.',
            'priority.required' => 'Vui lòng chọn mức độ ưu tiên.',
            'priority.enum' => 'Mức độ ưu tiên không hợp lệ.',
            'assignee_id.exists' => 'Nhân viên được phân công không tồn tại.',
        ];
    }
}
