<?php

namespace App\Policies;

use App\Models\Campaign;
use App\Models\User;

class CampaignPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('campaign.view');
    }

    public function view(User $user, Campaign $campaign): bool
    {
        if (!$user->hasPermission('campaign.view')) {
            return false;
        }

        return $this->checkDataScope($user, $campaign);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('campaign.create');
    }

    public function update(User $user, Campaign $campaign): bool
    {
        if (!$user->hasPermission('campaign.update')) {
            return false;
        }

        return $this->checkDataScope($user, $campaign);
    }

    public function delete(User $user, Campaign $campaign): bool
    {
        if (!$user->hasPermission('campaign.delete')) {
            return false;
        }

        return $this->checkDataScope($user, $campaign);
    }

    private function checkDataScope(User $user, Campaign $campaign): bool
    {
        $scope = $user->data_scope ?? 'MY';

        return match ($scope) {
            'ALL' => true,
            'TEAM' => in_array($campaign->owner_id, $user->teamMemberIds()),
            default => $campaign->owner_id === $user->id,
        };
    }
}