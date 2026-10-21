<?php

declare(strict_types=1);

namespace App\Http\Requests\PriceList;

use Illuminate\Foundation\Http\FormRequest;

class UpsertPriceListItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'min_qty' => ['nullable', 'numeric', 'min:0.01'],
        ];
    }
}
