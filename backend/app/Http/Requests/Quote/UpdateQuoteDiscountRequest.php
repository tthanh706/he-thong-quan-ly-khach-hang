<?php

namespace App\Http\Requests\Quote;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuoteDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'discount' => [
                'required',
                'numeric',
                'min:0',
                'max:100',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'discount.required' =>
                'Vui lòng nhập mức chiết khấu.',

            'discount.numeric' =>
                'Chiết khấu phải là số.',

            'discount.min' =>
                'Chiết khấu không được nhỏ hơn 0.',

            'discount.max' =>
                'Chiết khấu không được lớn hơn 100.',
        ];
    }
}