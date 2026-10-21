<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'contract_code',
        'contract_name',
        'customer_name',
        'owner_user_id',
        'accountant_user_id',
        'status',
        'contract_value',
        'signed_date',
        'start_date',
        'end_date',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'contract_value' => 'decimal:2',
            'signed_date' => 'date',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'owner_user_id'
        );
    }

    public function accountant(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'accountant_user_id'
        );
    }

    public function expiryAlerts(): HasMany
    {
        return $this->hasMany(
            ContractExpiryAlert::class
        );
    }

    public function renewalOpportunity(): HasOne
    {
        return $this->hasOne(
            Opportunity::class,
            'source_contract_id'
        );
    }
}