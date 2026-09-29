<?php

namespace App\Models;

class User 
{
    public function roles() 
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    public function businessTeam() 
    {
        return $this->belongsTo(BusinessTeam::class, 'business_team_id');
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'group_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    // 1 Tài khoản thuộc về 1 Nhóm
    public function group()
    {
        return $this->belongsTo(Group::class);
    }
}