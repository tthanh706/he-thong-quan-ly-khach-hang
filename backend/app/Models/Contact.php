<?php

namespace App\Models;

use App\Enums\ContactDecisionRoleEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contact extends Model
{
    protected $fillable = [
        'customer_id',
        'full_name',
        'job_title',
        'email',
        'phone',
        'decision_role',
        'is_primary',
    ];

    protected function casts(): array
    {
        return [
            'decision_role' => ContactDecisionRoleEnum::class,
            'is_primary' => 'boolean',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(ContactCustomerHistory::class);
    }
}