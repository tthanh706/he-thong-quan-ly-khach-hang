<?php

namespace App\Policies;

use App\Models\PeriodicCare;
use App\Models\User;

class PeriodicCarePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, PeriodicCare $periodicCare): bool
    {
        return $this->withinDataScope($user, $periodicCare);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, PeriodicCare $periodicCare): bool
    {
        return $this->withinDataScope($user, $periodicCare);
    }

    public function delete(User $user, PeriodicCare $periodicCare): bool
    {
        return $this->withinDataScope($user, $periodicCare);
    }

    public function markDone(User $user, PeriodicCare $periodicCare): bool
    {
        return $this->withinDataScope($user, $periodicCare);
    }

    private function withinDataScope(User $user, PeriodicCare $periodicCare): bool
    {
        $scope = $user->data_scope ?? 'MY';

        return match ($scope) {
            'ALL' => true,
            'TEAM' => in_array(
                $periodicCare->customer?->owner_id,
                $user->teamMemberIds(),
                true
            ) || $periodicCare->created_by === $user->id
              || $periodicCare->assignee_id === $user->id,
            default => $periodicCare->created_by === $user->id
                || $periodicCare->assignee_id === $user->id
                || $periodicCare->customer?->owner_id === $user->id,
        };
    }
}
