<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'contacts';

    protected $fillable = [
        'customer_id',
        'name',
        'title',
        'department',
        'phone',
        'email',
        'is_primary',
        'role_in_decision',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getFullNameAttribute(): ?string
    {
        return $this->name;
    }

    public function setFullNameAttribute($value): void
    {
        $this->attributes['name'] = $value;
    }

    public function getJobTitleAttribute(): ?string
    {
        return $this->title;
    }

    public function setJobTitleAttribute($value): void
    {
        $this->attributes['title'] = $value;
    }

    public function getDecisionRoleAttribute(): ?string
    {
        return $this->role_in_decision;
    }

    public function setDecisionRoleAttribute($value): void
    {
        $this->attributes['role_in_decision'] = $value;
    }
}
