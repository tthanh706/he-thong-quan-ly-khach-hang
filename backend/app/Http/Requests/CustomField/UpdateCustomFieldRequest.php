<?php

namespace App\Http\Requests\CustomField;

use App\Enums\CustomFieldModuleEnum;
use App\Enums\CustomFieldTypeEnum;
use App\Models\CustomField;
use App\Policies\CustomFieldPolicy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->attributes->get('current_user');

        $customField = $this->route('customField');

        return $user
            && $customField instanceof CustomField
            && app(CustomFieldPolicy::class)
                ->update($user, $customField);
    }

    public function rules(): array
    {
        return [
            'module' => [
                'sometimes',
                Rule::enum(CustomFieldModuleEnum::class),
            ],

            'field_name' => [
                'sometimes',
                'string',
                'max:150',
            ],

            'field_type' => [
                'sometimes',
                Rule::enum(CustomFieldTypeEnum::class),
            ],

            'options' => [
                'nullable',
                'array',
            ],

            'options.*' => [
                'string',
                'max:255',
                'distinct',
            ],

            'is_required' => [
                'sometimes',
                'boolean',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'module.enum' =>
                'Module không hợp lệ.',

            'field_name.max' =>
                'Tên trường không được vượt quá 150 ký tự.',

            'field_type.enum' =>
                'Kiểu dữ liệu không hợp lệ.',

            'options.*.distinct' =>
                'Các lựa chọn không được trùng nhau.',
        ];
    }
}