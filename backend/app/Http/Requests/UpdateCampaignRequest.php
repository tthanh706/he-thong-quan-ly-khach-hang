<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status'      => ['nullable', 'in:draft,active,paused,completed'],
            'starts_at'   => ['nullable', 'date'],
            'ends_at'     => ['nullable', 'date', 'after_or_equal:starts_at'],
            'budget'      => ['nullable', 'numeric', 'min:0'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'           => 'Tên chiến dịch không được để trống.',
            'status.in'               => 'Trạng thái phải là: draft, active, paused hoặc completed.',
            'ends_at.after_or_equal'  => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'budget.numeric'          => 'Ngân sách phải là số.',
            'budget.min'              => 'Ngân sách không được âm.',
            'customer_id.exists'      => 'Khách hàng được chọn không tồn tại.',
        ];
    }
}
