<?php

namespace App\Http\Requests;

use App\Enums\LeadStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'nullable',
                Rule::enum(LeadStatusEnum::class),
            ],

            'assigned_to' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'team_leader_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'sla_overdue' => [
                'nullable',
                'boolean',
            ],

            'search' => [
                'nullable',
                'string',
                'max:150',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.enum' =>
                'Trạng thái lead không hợp lệ.',

            'assigned_to.integer' =>
                'Nhân viên được phân không hợp lệ.',
            'assigned_to.exists' =>
                'Nhân viên được phân không tồn tại.',

            'team_leader_id.integer' =>
                'Trưởng nhóm không hợp lệ.',
            'team_leader_id.exists' =>
                'Trưởng nhóm không tồn tại.',

            'sla_overdue.boolean' =>
                'Giá trị SLA quá hạn không hợp lệ.',

            'search.max' =>
                'Từ khóa tìm kiếm không được vượt quá 150 ký tự.',

            'per_page.integer' =>
                'Số bản ghi mỗi trang phải là số nguyên.',
            'per_page.min' =>
                'Số bản ghi mỗi trang phải lớn hơn hoặc bằng 1.',
            'per_page.max' =>
                'Số bản ghi mỗi trang không được vượt quá 100.',
        ];
    }
}