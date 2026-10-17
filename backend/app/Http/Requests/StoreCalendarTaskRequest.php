<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCalendarTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assigned_user_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],
            'team_leader_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],
            'title' => [
                'required',
                'string',
                'max:180',
            ],
            'due_at' => [
                'required',
                'date',
            ],
            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }
}