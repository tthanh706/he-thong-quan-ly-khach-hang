<?php

namespace App\Policies;

use App\Models\CustomField;
use App\Models\User;

class CustomFieldPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function update(
        User $user,
        CustomField $customField
    ): bool {
        return $user->role === 'admin';
    }

    public function delete(
        User $user,
        CustomField $customField
    ): bool {
        return $user->role === 'admin';
    }
}