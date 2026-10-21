<?php

namespace App\Policies;

use App\Models\User;

/**
 * Policy for stage transition override permissions.
 *
 * Only users with role 'team_lead', 'manager', or 'admin'
 * are authorized to override stage transition conditions.
 */
class StageTransitionPolicy
{
    /**
     * Roles allowed to perform override on stage transitions.
     */
    private const OVERRIDE_ROLES = ['team_lead', 'manager', 'admin'];

    /**
     * Determine if the user can override stage transition conditions.
     */
    public function override(User $user): bool
    {
        return in_array($user->role, self::OVERRIDE_ROLES, true);
    }

    /**
     * Determine if the user can manage (create/update/delete) conditions.
     * Typically only managers and admins.
     */
    public function manageConditions(User $user): bool
    {
        return in_array($user->role, ['manager', 'admin'], true);
    }
}
