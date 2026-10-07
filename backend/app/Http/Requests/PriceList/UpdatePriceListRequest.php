<?php

declare(strict_types=1);

namespace App\Http\Requests\PriceList;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePriceListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('price_list')) ?? false;
    }

    public function rules(): array
    {
        $priceListId = $this->route('price_list')?->id;

        return [
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('price_lists', 'code')->ignore($priceListId)->whereNull('deleted_at'),
            ],
            'name' => ['required', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'max:8'],
            'is_standard' => ['boolean'],
            'is_active' => ['boolean'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Vui lòng nhập mã bảng giá.',
            'code.unique' => 'Mã bảng giá đã tồn tại trong hệ thống.',
            'name.required' => 'Vui lòng nhập tên bảng giá.',
            'effective_to.after_or_equal' => 'Ngày kết thúc hiệu lực phải sau hoặc bằng ngày bắt đầu.',
        ];
    }
}
