<?php

namespace App\Http\Requests\CustomField;

use App\Models\CustomField;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SaveCustomFieldValuesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->attributes->get('current_user') !== null;
    }

    public function rules(): array
    {
        return [
            'values' => [
                'required',
                'array',
            ],

            'values.*' => [
                'nullable',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'values.required' =>
                'Vui lòng gửi dữ liệu trường tùy chỉnh.',

            'values.array' =>
                'Dữ liệu trường tùy chỉnh không hợp lệ.',
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

                $fields = CustomField::query()
                    ->where('module', $module)
                    ->where('is_active', true)
                    ->get()
                    ->keyBy('field_key');

                $values = $this->input('values', []);

                foreach ($values as $fieldKey => $value) {
                    $field = $fields->get($fieldKey);

                    if (!$field) {
                        $validator->errors()->add(
                            "values.$fieldKey",
                            'Trường tùy chỉnh không tồn tại.'
                        );

                        continue;
                    }

                    $this->validateFieldValue(
                        $validator,
                        $fieldKey,
                        $field->field_type,
                        $field->options ?? [],
                        $value
                    );
                }

                foreach ($fields as $field) {
                    if (!$field->is_required) {
                        continue;
                    }

                    $value = $values[$field->field_key] ?? null;

                    if (
                        $value === null
                        || $value === ''
                    ) {
                        $validator->errors()->add(
                            'values.' . $field->field_key,
                            "Trường {$field->field_name} là bắt buộc."
                        );
                    }
                }
            },
        ];
    }

    private function validateFieldValue(
        Validator $validator,
        string $fieldKey,
        string $fieldType,
        array $options,
        mixed $value
    ): void {
        if ($value === null || $value === '') {
            return;
        }

        if ($fieldType === 'number' && !is_numeric($value)) {
            $validator->errors()->add(
                "values.$fieldKey",
                'Giá trị phải là số.'
            );

            return;
        }

        if (
            $fieldType === 'date'
            && !$this->isValidDate((string) $value)
        ) {
            $validator->errors()->add(
                "values.$fieldKey",
                'Ngày không đúng định dạng YYYY-MM-DD.'
            );

            return;
        }

        if (
            $fieldType === 'select'
            && !in_array((string) $value, $options, true)
        ) {
            $validator->errors()->add(
                "values.$fieldKey",
                'Giá trị không nằm trong danh sách cho phép.'
            );
        }
    }

    private function isValidDate(string $value): bool
    {
        $date = \DateTime::createFromFormat(
            'Y-m-d',
            $value
        );

        return $date
            && $date->format('Y-m-d') === $value;
    }
}