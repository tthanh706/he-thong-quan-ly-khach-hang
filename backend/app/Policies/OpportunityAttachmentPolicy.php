<?php

namespace App\Policies;

use App\Models\Opportunity;
use App\Models\User;

/**
 * Policy for opportunity attachment access control.
 *
 * Only the opportunity owner, shared users, and managers
 * are allowed to view/download/upload files.
 */
class OpportunityAttachmentPolicy
{
    /**
     * Manager roles with full access to all opportunity attachments.
     */
    private const MANAGER_ROLES = ['manager', 'admin'];

    /**
     * Determine if the user can view/download attachments.
     */
    public function viewAttachments(User $user, Opportunity $opportunity): bool
    {
        return $this->hasAccess($user, $opportunity);
    }

    /**
     * Determine if the user can upload attachments.
     */
    public function uploadAttachments(User $user, Opportunity $opportunity): bool
    {
        return $this->hasAccess($user, $opportunity);
    }

    /**
     * Determine if the user can delete attachments.
     * Only owner and managers can delete.
     */
    public function deleteAttachments(User $user, Opportunity $opportunity): bool
    {
        if ($this->isManager($user)) {
            return true;
        }

        return $opportunity->owner_id === $user->id;
    }

    /**
     * Check if a user has access to the opportunity.
     */
    private function hasAccess(User $user, Opportunity $opportunity): bool
    {
        // Managers have access to everything
        if ($this->isManager($user)) {
            return true;
        }

        // Owner has access
        if ($opportunity->owner_id === $user->id) {
            return true;
        }

        // Shared users have access
        return $opportunity->sharedUsers()
            ->where('user_id', $user->id)
            ->exists();
    }

    /**
     * Check if a user has manager-level role.
     */
    private function isManager(User $user): bool
    {
        return in_array($user->role, self::MANAGER_ROLES, true);
    }
}
