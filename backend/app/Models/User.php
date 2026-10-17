<?php

namespace App\Models;

use App\Enums\DataScopeEnum;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'locked_at',
        'lock_reason',
        'phone',
        'job_title',
        'email_signature',
        'failed_login_attempts',
        'locked_until',
        'data_scope',
        'status',
        'sales_team_id',
        'business_group',
        'can_view_opportunity_financials',
    ];

    protected $hidden = ['password', 'remember_token', 'avatar_path'];

    /**
     * S2-03: avatar_url được trả kèm mọi JSON user để hiển thị ảnh đại diện trên toàn hệ thống.
     */
    protected $appends = ['avatar_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'locked_at' => 'datetime',
            'locked_until' => 'datetime',
            'password' => 'hashed',
            'can_view_opportunity_financials' => 'boolean',
        ];
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'owner_user_id');
    }

    public function assignedLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'assigned_to_user_id');
    }

    public function calendarItems(): HasMany
    {
        return $this->hasMany(CalendarItem::class, 'user_id');
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'owner_user_id');
    }

    public function salesActivities(): HasMany
    {
        return $this->hasMany(SalesActivity::class, 'user_id');
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class, 'owner_id');
    }

    public function opportunities(): HasMany
    {
        return $this->hasMany(Opportunity::class, 'owner_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(UserSession::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    public function businessGroups(): BelongsToMany
    {
        return $this->belongsToMany(BusinessGroup::class, 'business_group_user');
    }

    public function periodicCares(): HasMany
    {
        return $this->hasMany(PeriodicCare::class, 'assignee_id');
    }

    public function supportRequests(): HasMany
    {
        return $this->hasMany(SupportRequest::class, 'assignee_id');
    }

    public function teamMemberIds(): array
    {
        $ids = [$this->id];

        // 1. Nhóm theo sales_team_id nếu có
        if (!empty($this->sales_team_id)) {
            $teamIds = static::where('sales_team_id', $this->sales_team_id)->pluck('id')->toArray();
            $ids = array_merge($ids, $teamIds);
        }

        // 2. Nhóm theo business_group_id hoặc pivot business_group_user
        $groupIds = [];
        if (!empty($this->business_group_id)) {
            $groupIds[] = $this->business_group_id;
        }

        try {
            $pivotGroupIds = $this->businessGroups()->pluck('business_groups.id')->toArray();
            $groupIds = array_merge($groupIds, $pivotGroupIds);
        } catch (\Throwable $e) {
            // Trường hợp DB chưa sync relation
        }

        if (!empty($groupIds)) {
            $groupIds = array_unique($groupIds);
            $memberIds = static::where(function ($q) use ($groupIds) {
                $q->whereIn('business_group_id', $groupIds)
                  ->orWhereHas('businessGroups', function ($bq) use ($groupIds) {
                      $bq->whereIn('business_groups.id', $groupIds);
                  });
            })->pluck('id')->toArray();

            $ids = array_merge($ids, $memberIds);
        }

        return array_values(array_unique(array_map('intval', $ids)));
    }

    public function hasRole(string $roleName): bool
    {
        if (strtolower((string)$this->role) === strtolower($roleName)) {
            return true;
        }

        return $this->relationLoaded('roles')
            ? $this->roles->contains(fn ($r) => strtolower((string)$r->name) === strtolower($roleName))
            : $this->roles()->where('name', $roleName)->exists();
    }


    public function isLocked(): bool
    {
        return $this->locked_at !== null;
    }

    public function isAdmin(): bool
    {
        if (strtolower((string)$this->role) === 'admin') {
            return true;
        }

        return $this->relationLoaded('roles')
            ? $this->roles->contains(fn ($r) => strtolower((string)$r->name) === 'admin')
            : $this->roles()->where('name', 'admin')->exists();
    }

    public function can($abilities, $arguments = []): bool
    {
        return $this->hasPermission((string) $abilities);
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin() || strtolower((string)$this->role) === 'admin' || strtoupper((string)$this->role) === 'SALES_DIRECTOR') {
            return true;
        }

        return in_array($permission, (array) ($this->permissions ?? []), true);
    }

    public function getDataScope(): DataScopeEnum
    {
        return $this->data_scope instanceof DataScopeEnum ? $this->data_scope : DataScopeEnum::MY;
    }

    protected function avatarUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->avatar_path
            ? Storage::disk('public')->url($this->avatar_path)
            : null);
    }
}
