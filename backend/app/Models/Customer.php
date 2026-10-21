<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'owner_id',
        'business_group_id',
        'status',
        'value',
        'email',
        'phone',
        'notes',
        'parent_customer_id',
    ];

    public function parentCustomer(): BelongsTo
    {
        return $this->belongsTo(
            Customer::class,
            'parent_customer_id'
        );
    }

    public function childCustomers(): HasMany
    {
        return $this->hasMany(
            Customer::class,
            'parent_customer_id'
        );
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }
}