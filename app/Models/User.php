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
    }
}