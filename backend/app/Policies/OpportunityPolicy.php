<?php

namespace App\Policies;

use App\Models\Opportunity;
use App\Models\User;

class OpportunityPolicy
{
    /**
     * Thành viên được chia sẻ có thể xem và ghi hoạt động,
     * nhưng không được đổi owner, xóa, hoặc quản lý members.
     */
    public function view(User $user, Opportunity $opportunity): bool
    {
        if (!$user->hasPermission('opportunity.view')) {
            return false;
        }

        // Owner hoặc Member đều xem được
        if ($opportunity->isAccessibleBy($user)) {
            return true;
        }

        // Data Scope fallback
        return $this->checkDataScope($user, $opportunity);
    }

    public function update(User $user, Opportunity $opportunity): bool
    {
        if (!$user->hasPermission('opportunity.update')) {
            return false;
        }

        // Chỉ owner mới được update thông tin chính (stage, amount, ...)
        // Member chỉ được ghi activity, không update opportunity
        return $opportunity->owner_id === $user->id
            || $this->checkDataScope($user, $opportunity);
    }

    /**
     * Quản lý thành viên (thêm/xóa member)
     */
    public function manageMembers(User $user, Opportunity $opportunity): bool
    {
        // Chỉ owner hoặc người có quyền cao hơn
        return $opportunity->owner_id === $user->id
            || $user->hasPermission('opportunity.manage_members');
    }

    /**
     * Chuyển quyền sở hữu
     */
    public function transferOwnership(User $user, Opportunity $opportunity): bool
    {
        return $opportunity->owner_id === $user->id
            || $user->hasPermission('opportunity.transfer_ownership');
    }

    /**
     * Ghi hoạt động (Activity) – Member cũng được phép
     */
    public function createActivity(User $user, Opportunity $opportunity): bool
    {
        if (!$user->hasPermission('activity.create')) {
            return false;
        }

        return $opportunity->isAccessibleBy($user);
    }

    private function checkDataScope(User $user, Opportunity $opportunity): bool
    {
        $scope = $user->data_scope ?? 'MY';

        if ($scope === 'ALL') {
            return true;
        }

        if ($scope === 'TEAM') {
            return in_array($opportunity->owner_id, $user->teamMemberIds() ?? [], true);
        }

        return $opportunity->owner_id === $user->id;
    }
}
