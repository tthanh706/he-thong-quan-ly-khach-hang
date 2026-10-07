<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LockAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id ?? $this->route('user');

        return [
            'replacement_user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(fn ($query) => $query->whereNull('locked_at')),
                Rule::notIn([$userId]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'replacement_user_id.required' => 'Vui lòng chọn người tiếp nhận.',
            'replacement_user_id.exists' => 'Người tiếp nhận không tồn tại hoặc đang bị khóa.',
            'replacement_user_id.not_in' => 'Người bị khóa không thể tự tiếp nhận dữ liệu của chính mình.',
        ];
    }
}
