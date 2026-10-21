<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterCalendarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'view' => $this->input('view', 'month'),
            'date' => $this->input('date', date('Y-m-d')),
        ]);
    }

    public function rules(): array
    {
        return [
            'view' => [
                'nullable',
                Rule::in([
                    'day',
                    'week',
                    'month',
                ]),
            ],
            'date' => [
                'nullable',
                'date',
            ],
        ];
    }
}