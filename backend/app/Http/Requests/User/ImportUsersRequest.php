<?php

namespace App\Http\Requests\User;

use App\Services\UserImportService;
use Illuminate\Foundation\Http\FormRequest;

class ImportUsersRequest extends FormRequest
{
    public const MAX_FILE_SIZE_KB = 5120;

    /**
     * Quyền quản trị đã được kiểm tra bởi middleware "admin.role".
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
            'file' => ['required', 'file', 'extensions:xlsx,csv', 'max:'.self::MAX_FILE_SIZE_KB],
            'dry_run' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Vui lòng chọn file danh sách người dùng.',
            'file.file' => 'Tải file lên không thành công, vui lòng thử lại.',
            'file.extensions' => 'Chỉ hỗ trợ file Excel (.xlsx) hoặc CSV (.csv).',
            'file.max' => 'Dung lượng file không được vượt quá 5MB (tối đa '.UserImportService::MAX_ROWS.' người dùng/lần).',
            'dry_run.boolean' => 'Tham số chạy thử không hợp lệ.',
        ];
    }
}
