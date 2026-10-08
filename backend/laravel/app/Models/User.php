<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\DataScopeEnum;
use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Model implements AuthenticatableContract
{
    use Authenticatable, HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'sales_team_id',
        'data_scope',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'data_scope' => DataScopeEnum::class,
            'is_active' => 'boolean',
        ];
    }

    /**
     * Check if user has permission.
     */
    public function can($abilities, $arguments = []): bool
    {
        return $this->hasPermission((string) $abilities);
    }

    /**
     * Check if user has permission.
     */
    public function hasPermission(string $permission): bool
    {
        // Admin or Giám đốc kinh doanh has full management
        if ($this->role === 'ADMIN' || $this->role === 'SALES_DIRECTOR') {
            return true;
        }

        // Custom permission check
        return in_array($permission, (array) ($this->permissions ?? []), true);
    }

    /**
     * Scope data according to user's assigned scope.
     */
    public function getDataScope(): DataScopeEnum
    {
        return $this->data_scope ?? DataScopeEnum::MY;
    }
}
