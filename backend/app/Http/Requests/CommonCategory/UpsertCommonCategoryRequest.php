<?php

declare(strict_types=1);

namespace App\Http\Requests\CommonCategory;

use App\Enums\CategoryTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertCommonCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('common_category')?->id;

        return [
            'category_type' => ['required', Rule::enum(CategoryTypeEnum::class)],
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('common_categories', 'code')
                    ->ignore($id)
                    ->where(fn ($q) => $q->where('category_type', $this->input('category_type'))->whereNull('deleted_at')),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.unique' => 'Mã danh mục đã tồn tại trong loại này.',
        ];
    }
}
