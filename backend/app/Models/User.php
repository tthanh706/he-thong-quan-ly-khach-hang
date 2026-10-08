<?php

namespace App\Models;

use App\Enums\DataScopeEnum;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'locked_at',
        'phone',
        'job_title',
        'email_signature',
        'failed_login_attempts',
        'locked_until',
        'data_scope',
        'status',
        'sales_team_id',
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
        ];
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

    public function isLocked(): bool
    {
        return $this->locked_at !== null;
    }

    public function isAdmin(): bool
    {
        return strtolower((string)$this->role) === 'admin';
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
