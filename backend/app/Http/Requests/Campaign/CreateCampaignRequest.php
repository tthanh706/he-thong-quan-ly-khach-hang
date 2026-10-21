<?php

namespace App\Http\Requests\Campaign;

use App\Enums\CampaignChannelEnum;
use App\Enums\CampaignStatusEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Campaign::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'budget' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'channel' => ['required', Rule::in(CampaignChannelEnum::values())],
            'status' => ['sometimes', Rule::in(CampaignStatusEnum::values())],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên chiến dịch là bắt buộc.',
            'name.max' => 'Tên chiến dịch không được vượt quá 255 ký tự.',
            'budget.required' => 'Ngân sách là bắt buộc.',
            'budget.min' => 'Ngân sách phải lớn hơn hoặc bằng 0.',
            'start_date.required' => 'Ngày bắt đầu là bắt buộc.',
            'end_date.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'channel.required' => 'Kênh là bắt buộc.',
            'channel.in' => 'Kênh không hợp lệ.',
        ];
    }
}