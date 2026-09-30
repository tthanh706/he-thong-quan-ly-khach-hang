<?php

namespace App\Models\Concerns;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Moi ban ghi phan quyen theo du lieu so huu deu co `owner_id` + `team_id`.
 * `team_id` la nhom cua nguoi so huu tai thoi diem tao - dung cho pham vi "cua nhom toi".
 */
trait HasOwnership
{
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /** Ghi de gia tri so huu khi nguoi dung tao ban ghi. */
    public function assignOwnership(User $creator): static
    {
        $this->owner_id = $creator->id;
        $this->team_id = $creator->team_id;

        return $this;
    }

    public function scopeOfOwner(Builder $query, User $user): Builder
    {
        return $query->where(
            $query->getModel()->qualifyColumn('owner_id'),
            $user->id,
        );
    }
}
