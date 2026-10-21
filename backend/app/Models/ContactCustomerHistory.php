<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactCustomerHistory extends Model
{
    protected $fillable = [
        'contact_id',
        'old_customer_id',
        'new_customer_id',
        'changed_by',
        'changed_at',
    ];

    protected function casts(): array
    {
        return [
            'changed_at' => 'datetime',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function oldCustomer(): BelongsTo
    {
        return $this->belongsTo(
            Customer::class,
            'old_customer_id',
        );
    }

    public function newCustomer(): BelongsTo
    {
        return $this->belongsTo(
            Customer::class,
            'new_customer_id',
        );
    }

    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'changed_by',
        );
    }
}