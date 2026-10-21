<?php

declare(strict_types=1);

namespace App\Http\Requests\Product;

use App\Enums\ProductTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Product::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'sku' => ['required', 'string', 'max:64', Rule::unique('products', 'sku')->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(ProductTypeEnum::class)],
            'unit' => ['required', 'string', 'max:32'],
            'description' => ['nullable', 'string', 'max:2000'],
            'list_price' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'sku.unique' => 'SKU đã tồn tại.',
            'sku.required' => 'Vui lòng nhập SKU.',
            'name.required' => 'Vui lòng nhập tên sản phẩm / dịch vụ.',
        ];
    }
}
