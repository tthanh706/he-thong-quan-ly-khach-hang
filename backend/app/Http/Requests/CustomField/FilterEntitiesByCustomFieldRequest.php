<?php

namespace App\Http\Requests\CustomField;

use App\Models\CustomField;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class FilterEntitiesByCustomFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->attributes->get('current_user') !== null;
    }

    public function rules(): array
    {
        return [
            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            'custom_fields' => [
                'nullable',
                'array',
            ],

            'custom_fields.*' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $module = $this->route('module');

                if (!in_array(
                    $module,
                    ['customer', 'opportunity'],
                    true
                )) {
                    $validator->errors()->add(
                        'module',
                        'Module không hợp lệ.'
                    );

                    return;
                }

                $fieldKeys = CustomField::query()
                    ->where('module', $module)
                    ->where('is_active', true)
                    ->pluck('field_key')
                    ->all();

                foreach (
                    $this->input('custom_fields', [])
                    as $fieldKey => $value
                ) {
                    if (
                        !in_array(
                            $fieldKey,
                            $fieldKeys,
                            true
                        )
                    ) {
                        $validator->errors()->add(
                            "custom_fields.$fieldKey",
                            'Trường lọc không tồn tại.'
                        );
                    }
                }
            },
        ];
    }
}