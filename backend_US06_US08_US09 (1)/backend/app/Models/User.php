<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Model User cơ bản (giả định đã có từ Sprint 1).
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'sales_team_id',
        'data_scope', // MY | TEAM | ALL
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    public function teamMemberIds(): array
    {
        // Giả định: lấy danh sách user_id cùng sales_team_id
        if (!$this->sales_team_id) {
            return [$this->id];
        }

        return static::where('sales_team_id', $this->sales_team_id)
            ->pluck('id')
            ->toArray();
    }
}
