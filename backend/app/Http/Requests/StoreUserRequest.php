<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'name'=>['required','string','max:255'],
            'email'=>['required','email','max:255','unique:users,email'],
            'business_group'=>['nullable','string','max:255'],
            'role'=>['required','in:admin,manager,sales'],
        ];
    }
    public function messages(): array
    {
        return [
            'email.unique'=>'Email này đã tồn tại trong hệ thống.',
            'role.in'=>'Vai trò không hợp lệ.',
            'name.required'=>'Vui lòng nhập họ tên.',
            'email.required'=>'Vui lòng nhập email.',
            'email.email'=>'Email không đúng định dạng.',
        ];
    }
}
