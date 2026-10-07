<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\CommonCategory;
use App\Models\User;

class CommonCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('common_category.view');
    }

    public function view(User $user, CommonCategory $commonCategory): bool
    {
        return $user->can('common_category.view');
    }

    public function create(User $user): bool
    {
        return $user->can('common_category.manage');
    }

    public function update(User $user, CommonCategory $commonCategory): bool
    {
        return $user->can('common_category.manage');
    }

    public function delete(User $user, CommonCategory $commonCategory): bool
    {
        return $user->can('common_category.manage');
    }
}
