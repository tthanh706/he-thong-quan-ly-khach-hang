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

    public function rules(): array
    {
        return [
            'view' => [
                'required',
                Rule::in([
                    'day',
                    'week',
                    'month',
                ]),
            ],
            'date' => [
                'required',
                'date',
            ],
        ];
    }
}