<?php

namespace App\Http\Requests;

use App\Models\OpportunityAttachment;
use Illuminate\Foundation\Http\FormRequest;

class UploadAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'files'   => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => [
                'required',
                'file',
                'max:' . OpportunityAttachment::MAX_FILE_SIZE_KB, // 20MB in KB
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png,gif,webp,zip,rar,7z',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'files.required'   => 'Vui lòng chọn ít nhất 1 tệp.',
            'files.max'        => 'Tối đa 10 tệp mỗi lần tải.',
            'files.*.max'      => 'Mỗi tệp không được vượt quá 20MB.',
            'files.*.file'     => 'Tệp không hợp lệ.',
            'files.*.mimes'    => 'Định dạng tệp không được hỗ trợ. Hỗ trợ: PDF, DOC, XLS, PPT, TXT, CSV, ảnh, ZIP.',
        ];
    }
}
