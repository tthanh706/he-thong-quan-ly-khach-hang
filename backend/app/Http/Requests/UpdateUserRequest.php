<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        $user = $this->route('user');
        $id = is_object($user) ? $user->id : $user;
        return [
            'name'=>['sometimes','required','string','max:255'],
            'email'=>['sometimes','required','email','max:255',Rule::unique('users','email')->ignore($id)],
            'business_group'=>['nullable','string','max:255'],
            'role'=>['sometimes','required','in:admin,manager,sales'],
            'status'=>['sometimes','required','in:pending,active,inactive'],
        ];
    }
    public function messages(): array
    {
        return [
            'email.unique'=>'Email này đã tồn tại trong hệ thống.',
            'role.in'=>'Vai trò không hợp lệ.',
            'status.in'=>'Trạng thái không hợp lệ.',
        ];
    }
}
