<?php

namespace App\Http\Requests\OpportunityMember;

use Illuminate\Foundation\Http\FormRequest;

class TransferOwnershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        $opportunity = $this->route('opportunity');
        // Chỉ owner hiện tại hoặc admin mới được chuyển quyền
        return $this->user()->can('transferOwnership', $opportunity);
    }

    public function rules(): array
    {
        return [
            'new_owner_id' => [
                'required',
                'integer',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    $opportunity = $this->route('opportunity');
                    if ((int) $value === (int) $opportunity->owner_id) {
                        $fail('Người được chọn đã là chủ sở hữu hiện tại.');
                    }
                },
            ],
            'note' => ['nullable', 'string', 'max:1000'],
            'keep_as_member' => ['nullable', 'boolean'], // Giữ owner cũ làm member sau khi chuyển
        ];
    }

    public function messages(): array
    {
        return [
            'new_owner_id.required' => 'Vui lòng chọn người nhận quyền sở hữu.',
            'new_owner_id.exists' => 'Người dùng không tồn tại.',
        ];
    }
}