<?php

namespace App\Http\Requests\CustomField;

use App\Enums\CustomFieldModuleEnum;
use App\Enums\CustomFieldTypeEnum;
use App\Policies\CustomFieldPolicy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->attributes->get('current_user');

        return $user
            && app(CustomFieldPolicy::class)->create($user);
    }

    public function rules(): array
    {
        return [
            'module' => [
                'required',
                Rule::enum(CustomFieldModuleEnum::class),
            ],

            'field_name' => [
                'required',
                'string',
                'max:150',
            ],

            'field_type' => [
                'required',
                Rule::enum(CustomFieldTypeEnum::class),
            ],

            'options' => [
                'nullable',
                'array',
                'required_if:field_type,select',
            ],

            'options.*' => [
                'string',
                'max:255',
                'distinct',
            ],

            'is_required' => [
                'required',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'module.required' =>
                'Vui lòng chọn module.',

            'module.enum' =>
                'Module không hợp lệ.',

            'field_name.required' =>
                'Vui lòng nhập tên trường.',

            'field_name.max' =>
                'Tên trường không được vượt quá 150 ký tự.',

            'field_type.required' =>
                'Vui lòng chọn kiểu dữ liệu.',

            'field_type.enum' =>
                'Kiểu dữ liệu không hợp lệ.',

            'options.required_if' =>
                'Trường danh sách chọn phải có lựa chọn.',

            'options.*.distinct' =>
                'Các lựa chọn không được trùng nhau.',

            'is_required.required' =>
                'Vui lòng xác định trường có bắt buộc hay không.',
        ];
    }
}