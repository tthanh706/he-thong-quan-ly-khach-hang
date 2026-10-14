<?php

namespace App\Http\Requests\Customer;

use App\Models\Customer;
use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:customers,code'],
            'tax_code' => ['nullable', 'string', 'max:50', 'unique:customers,tax_code'],
            'taxCode' => ['nullable', 'string', 'max:50'],
            'industry' => ['nullable', 'string', 'max:255'],
            'company_size' => ['nullable', 'string', 'max:100'],
            'scale' => ['nullable', 'string', 'max:100'],
            'website' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:100'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'ownerId' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['required', 'string'],
            'tier' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'notes' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:customers,id'],
            'parentId' => ['nullable', 'integer', 'exists:customers,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên công ty / khách hàng là bắt buộc.',
            'name.max' => 'Tên công ty không được vượt quá 255 ký tự.',
            'tax_code.unique' => 'Mã số thuế này đã tồn tại trong hệ thống. Mã số thuế phải là duy nhất.',
            'status.required' => 'Vui lòng chọn trạng thái khách hàng (Tiềm năng, Đang giao dịch, Khách hàng, Ngừng hợp tác).',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'owner_id.exists' => 'Người sở hữu không tồn tại trong hệ thống.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Đồng bộ dữ liệu camelCase sang snake_case
        $mergeData = [];
        if ($this->filled('taxCode') && !$this->filled('tax_code')) {
            $mergeData['tax_code'] = $this->input('taxCode');
        }
        if ($this->filled('scale') && !$this->filled('company_size')) {
            $mergeData['company_size'] = $this->input('scale');
        }
        if ($this->filled('ownerId') && !$this->filled('owner_id')) {
            $mergeData['owner_id'] = $this->input('ownerId');
        }
        if ($this->filled('parentId') && !$this->filled('parent_id')) {
            $mergeData['parent_id'] = $this->input('parentId');
        }
        if (!$this->filled('status') && $this->filled('tier')) {
            $mergeData['status'] = $this->input('tier');
        }

        if (!empty($mergeData)) {
            $this->merge($mergeData);
        }
    }
}
