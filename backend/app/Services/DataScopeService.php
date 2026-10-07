<?php
namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class DataScopeService
{
    public function apply(Builder $query, User $user): Builder
    {
        return match ($user->data_scope) {
            'ALL' => $query,
            'TEAM' => $query->where('business_group_id', $user->business_group_id),
            default => $query->where('owner_id', $user->id),
        };
    }

    public function canAccess(object $record, User $user): bool
    {
        return match ($user->data_scope) {
            'ALL' => true,
            'TEAM' => (int) $record->business_group_id === (int) $user->business_group_id,
            default => (int) $record->owner_id === (int) $user->id,
        };
    }
}
