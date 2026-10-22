<?php

namespace App\Http\Requests\Activity;

use App\Enums\ActivityTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'exists:customers,id'],
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'opportunity_id' => ['nullable', 'exists:opportunities,id'],
            'type' => ['required', Rule::enum(ActivityTypeEnum::class)],
            'title' => ['required', 'string', 'max:255'],
            'performed_at' => ['required', 'date'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'description' => ['required', 'string'],
            'result' => ['nullable', 'string'],
            'status' => ['nullable', 'in:completed,scheduled'],
        ];
    }
}