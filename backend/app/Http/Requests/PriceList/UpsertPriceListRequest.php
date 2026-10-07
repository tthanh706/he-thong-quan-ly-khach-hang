<?php

declare(strict_types=1);

namespace App\Http\Requests\PriceList;

use Illuminate\Foundation\Http\FormRequest;

class UpsertPriceListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'max:8'],
            'is_standard' => ['boolean'],
            'is_active' => ['boolean'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
