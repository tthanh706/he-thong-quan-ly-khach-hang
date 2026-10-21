<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['nullable', 'email', 'max:255', 'unique:customers,email'],
            'phone'       => ['nullable', 'string', 'max:20'],
            'address'     => ['nullable', 'string', 'max:500'],
            'company'     => ['nullable', 'string', 'max:255'],
            'status'      => ['nullable', 'in:lead,prospect,active,inactive'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'notes'       => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'        => 'Tên khách hàng không được để trống.',
            'email.email'          => 'Email không đúng định dạng.',
            'email.unique'         => 'Email này đã được sử dụng.',
            'status.in'            => 'Trạng thái phải là: lead, prospect, active hoặc inactive.',
            'assigned_to.exists'   => 'Nhân viên được chọn không tồn tại.',
        ];
    }
}
