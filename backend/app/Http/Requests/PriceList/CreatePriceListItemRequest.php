<?php

declare(strict_types=1);

namespace App\Http\Requests\PriceList;

use Illuminate\Foundation\Http\FormRequest;

class CreatePriceListItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('price_list')) ?? true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'min_qty' => ['nullable', 'numeric', 'min:0.01'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Vui lòng chọn sản phẩm / dịch vụ.',
            'product_id.exists' => 'Sản phẩm / dịch vụ không tồn tại.',
            'unit_price.required' => 'Vui lòng nhập đơn giá.',
            'unit_price.min' => 'Đơn giá không được âm.',
        ];
    }
}
