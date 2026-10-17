<?php

namespace App\Policies;

use App\Models\SupportRequest;
use App\Models\User;

class SupportRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SupportRequest $supportRequest): bool
    {
        return $this->withinDataScope($user, $supportRequest);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, SupportRequest $supportRequest): bool
    {
        return $this->withinDataScope($user, $supportRequest);
    }

    public function delete(User $user, SupportRequest $supportRequest): bool
    {
        return $this->withinDataScope($user, $supportRequest);
    }

    public function assign(User $user, SupportRequest $supportRequest): bool
    {
        return $this->withinDataScope($user, $supportRequest);
    }

    private function withinDataScope(User $user, SupportRequest $supportRequest): bool
    {
        $scope = $user->data_scope ?? 'MY';

        return match ($scope) {
            'ALL' => true,
            'TEAM' => in_array(
                $supportRequest->customer?->owner_id,
                $user->teamMemberIds(),
                true
            ) || $supportRequest->created_by === $user->id
              || $supportRequest->assignee_id === $user->id,
            default => $supportRequest->created_by === $user->id
                || $supportRequest->assignee_id === $user->id
                || $supportRequest->customer?->owner_id === $user->id,
        };
    }
}
