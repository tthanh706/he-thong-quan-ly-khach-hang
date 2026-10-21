<?php

declare(strict_types=1);

namespace App\Http\Requests\CommonCategory;

use App\Enums\CategoryTypeEnum;
use App\Models\CommonCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateCommonCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', CommonCategory::class) ?? true;
    }

    public function rules(): array
    {
        return [
            'category_type' => ['required', Rule::enum(CategoryTypeEnum::class)],
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('common_categories', 'code')
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
            'category_type.required' => 'Vui lòng chọn loại danh mục.',
            'code.required' => 'Vui lòng nhập mã danh mục.',
            'code.unique' => 'Mã danh mục đã tồn tại trong nhóm này.',
            'name.required' => 'Vui lòng nhập tên danh mục.',
        ];
    }
}
