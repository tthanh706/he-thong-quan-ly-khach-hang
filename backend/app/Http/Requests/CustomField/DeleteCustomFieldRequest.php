<?php

namespace App\Http\Requests\CustomField;

use App\Models\CustomField;
use App\Policies\CustomFieldPolicy;
use Illuminate\Foundation\Http\FormRequest;

class DeleteCustomFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->attributes->get('current_user');

        $customField =
            $this->route('customField');

        return $user
            && $customField instanceof CustomField
            && app(CustomFieldPolicy::class)
                ->delete($user, $customField);
    }

    public function rules(): array
    {
        return [];
    }
}