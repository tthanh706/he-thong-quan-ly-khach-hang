<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rows' => 'required|array|min:1',
            'rows.*.name' => 'required|string|max:255',
            'rows.*.phone' => 'nullable|string|max:20',
            'rows.*.email' => 'nullable|email|max:255',
            'rows.*.address' => 'nullable|string|max:500',
        ];
    }
}
