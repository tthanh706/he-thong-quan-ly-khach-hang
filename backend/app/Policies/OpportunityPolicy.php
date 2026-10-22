<?php

namespace App\Policies;

use App\Models\Opportunity;
use App\Models\User;

class OpportunityPolicy
{
    // Kiểm tra quyền chỉnh sửa thông thường
    public function update(User $user, Opportunity $opportunity): bool
    {
        if ($opportunity->is_locked) {
            return false; // Đã đóng thì không ai được sửa thông tin cơ bản
        }
        return $user->id === $opportunity->owner_id || $user->hasRole(['Sales Manager', 'Director']);
    }

    // Kiểm tra quyền mở lại (chỉ Trưởng nhóm/Giám đốc)
    public function reopen(User $user, Opportunity $opportunity): bool
    {
        return $user->hasRole(['Sales Manager', 'Director']);
    }
}