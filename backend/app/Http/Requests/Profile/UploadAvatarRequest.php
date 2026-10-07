<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UploadAvatarRequest extends FormRequest
{
    public const MAX_FILE_SIZE_KB = 2048;

    public const MIN_DIMENSION = 64;

    public const MAX_DIMENSION = 4096;

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
            'avatar' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:'.self::MAX_FILE_SIZE_KB,
                'dimensions:min_width='.self::MIN_DIMENSION.',min_height='.self::MIN_DIMENSION
                    .',max_width='.self::MAX_DIMENSION.',max_height='.self::MAX_DIMENSION,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'avatar.required' => 'Vui lòng chọn ảnh đại diện.',
            'avatar.file' => 'Tải ảnh lên không thành công, vui lòng thử lại.',
            'avatar.image' => 'File tải lên phải là hình ảnh.',
            'avatar.mimes' => 'Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WEBP.',
            'avatar.max' => 'Dung lượng ảnh không được vượt quá 2MB.',
            'avatar.dimensions' => 'Kích thước ảnh phải từ '.self::MIN_DIMENSION.'x'.self::MIN_DIMENSION
                .' đến '.self::MAX_DIMENSION.'x'.self::MAX_DIMENSION.' pixel.',
        ];
    }
}
