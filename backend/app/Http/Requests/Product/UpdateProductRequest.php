<?php

declare(strict_types=1);

namespace App\Http\Requests\Product;

use App\Enums\ProductTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('product')) ?? false;
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'sku' => [
                'required',
                'string',
                'max:64',
                Rule::unique('products', 'sku')->ignore($productId)->whereNull('deleted_at'),
            ],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(ProductTypeEnum::class)],
            'unit' => ['required', 'string', 'max:32'],
            'description' => ['nullable', 'string', 'max:2000'],
            'list_price' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'is_active' => ['boolean'],
        ];
    }
}
