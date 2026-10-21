<?php

namespace App\Http\Requests\PeriodicCare;

use App\Enums\CareTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePeriodicCareRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'care_type' => ['required', Rule::enum(CareTypeEnum::class)],
            'scheduled_date' => ['required', 'date', 'after_or_equal:today'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Vui lòng chọn khách hàng.',
            'customer_id.exists' => 'Khách hàng không tồn tại.',
            'care_type.required' => 'Vui lòng chọn loại hình chăm sóc.',
            'care_type.enum' => 'Loại hình chăm sóc không hợp lệ.',
            'scheduled_date.required' => 'Vui lòng chọn ngày thực hiện.',
            'scheduled_date.after_or_equal' => 'Ngày thực hiện phải từ hôm nay trở đi.',
            'assignee_id.exists' => 'Nhân viên phụ trách không tồn tại.',
        ];
    }
}
