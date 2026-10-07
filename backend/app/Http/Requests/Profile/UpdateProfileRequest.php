<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public const PHONE_REGEX = '/^(\+84|0)\d{9,10}$/';

    public const MAX_JOB_TITLE_LENGTH = 150;

    public const MAX_SIGNATURE_LENGTH = 2000;

    /**
     * Người dùng chỉ cập nhật hồ sơ của chính mình (xác định từ phiên đăng nhập).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'regex:'.self::PHONE_REGEX],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:'.self::MAX_JOB_TITLE_LENGTH],
            'email_signature' => ['sometimes', 'nullable', 'string', 'max:'.self::MAX_SIGNATURE_LENGTH],
            'email' => ['prohibited'],
            'role' => ['prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Vui lòng nhập họ tên.',
            'name.max' => 'Họ tên không được vượt quá 255 ký tự.',
            'phone.regex' => 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678).',
            'job_title.max' => 'Chức danh không được vượt quá '.self::MAX_JOB_TITLE_LENGTH.' ký tự.',
            'email_signature.max' => 'Chữ ký email không được vượt quá '.self::MAX_SIGNATURE_LENGTH.' ký tự.',
            'email.prohibited' => 'Không thể tự thay đổi email đăng nhập. Vui lòng liên hệ quản trị viên.',
            'role.prohibited' => 'Không thể tự thay đổi vai trò.',
        ];
    }
}
