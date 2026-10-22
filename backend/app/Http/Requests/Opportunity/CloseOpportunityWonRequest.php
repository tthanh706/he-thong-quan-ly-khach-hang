<?php

namespace App\Http\Requests\Opportunity;

use Illuminate\Foundation\Http\FormRequest;

class CloseOpportunityWonRequest extends FormRequest
{
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'actual_revenue' => 'required|numeric|min:0',
            'actual_close_date' => 'required|date|date_format:Y-m-d',
        ];
    }

    public function messages(): array {
        return [
            'actual_revenue.required' => 'Giá trị chốt thực tế là bắt buộc khi đóng thắng.',
            'actual_revenue.numeric' => 'Giá trị chốt thực tế phải là chữ số.',
            'actual_close_date.required' => 'Ngày ký hợp đồng là bắt buộc khi đóng thắng.',
        ];
    }
}