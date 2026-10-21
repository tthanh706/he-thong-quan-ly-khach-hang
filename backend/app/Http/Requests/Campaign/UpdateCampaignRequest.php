<?php

namespace App\Http\Requests\Campaign;

use App\Enums\CampaignChannelEnum;
use App\Enums\CampaignStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('campaign'));
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'budget' => ['sometimes', 'required', 'numeric', 'min:0', 'max:999999999999.99'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'channel' => ['sometimes', 'required', Rule::in(CampaignChannelEnum::values())],
            'status' => ['sometimes', Rule::in(CampaignStatusEnum::values())],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên chiến dịch là bắt buộc.',
            'budget.min' => 'Ngân sách phải lớn hơn hoặc bằng 0.',
            'end_date.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'channel.in' => 'Kênh không hợp lệ.',
        ];
    }
}