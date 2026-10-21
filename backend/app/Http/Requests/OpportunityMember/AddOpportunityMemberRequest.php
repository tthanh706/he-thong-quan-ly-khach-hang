<?php

namespace App\Http\Requests\OpportunityMember;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddOpportunityMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        $opportunity = $this->route('opportunity');
        // Chỉ owner hoặc người có quyền manage members mới được thêm
        return $this->user()->can('manageMembers', $opportunity);
    }

    public function rules(): array
    {
        $opportunityId = $this->route('opportunity')->id;

        return [
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
                Rule::unique('opportunity_members', 'user_id')
                    ->where('opportunity_id', $opportunityId),
                // Không cho thêm chính owner vào members
                function ($attribute, $value, $fail) {
                    $opportunity = $this->route('opportunity');
                    if ((int) $value === (int) $opportunity->owner_id) {
                        $fail('Người sở hữu đã là chủ cơ hội, không cần thêm vào thành viên.');
                    }
                },
            ],
            'role' => ['nullable', 'string', 'in:member,collaborator'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'Vui lòng chọn thành viên.',
            'user_id.exists' => 'Người dùng không tồn tại.',
            'user_id.unique' => 'Người dùng này đã là thành viên của cơ hội.',
            'role.in' => 'Vai trò không hợp lệ.',
        ];
    }
}