<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $customerId = $this->route('id') ?? $this->route('customer');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', Rule::unique('customers', 'code')->ignore($customerId)],
            'tax_code' => ['nullable', 'string', 'max:50', Rule::unique('customers', 'tax_code')->ignore($customerId)],
            'taxCode' => ['nullable', 'string', 'max:50'],
            'industry' => ['nullable', 'string', 'max:255'],
            'company_size' => ['nullable', 'string', 'max:100'],
            'scale' => ['nullable', 'string', 'max:100'],
            'website' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:100'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'ownerId' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'string'],
            'tier' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'notes' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer'],
            'parentId' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên công ty / khách hàng là bắt buộc.',
            'tax_code.unique' => 'Mã số thuế này đã tồn tại trong hệ thống. Mã số thuế phải là duy nhất.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'owner_id.exists' => 'Người sở hữu không tồn tại trong hệ thống.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $mergeData = [];
        if ($this->has('taxCode') && !$this->has('tax_code')) {
            $mergeData['tax_code'] = $this->input('taxCode');
        }
        if ($this->has('scale') && !$this->has('company_size')) {
            $mergeData['company_size'] = $this->input('scale');
        }
        if ($this->has('ownerId') && !$this->has('owner_id')) {
            $mergeData['owner_id'] = $this->input('ownerId');
        }
        if ($this->has('parentId') && !$this->has('parent_id')) {
            $mergeData['parent_id'] = $this->input('parentId');
        }
        if (!$this->has('status') && $this->has('tier')) {
            $mergeData['status'] = $this->input('tier');
        }

        if (!empty($mergeData)) {
            $this->merge($mergeData);
        }
    }
}
