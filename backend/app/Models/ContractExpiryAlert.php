<?php

namespace App\Models;

use App\Enums\ContractAlertTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractExpiryAlert extends Model
{
    protected $fillable = [
        'contract_id',
        'recipient_user_id',
        'type',
        'message',
        'detected_at',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => ContractAlertTypeEnum::class,
            'detected_at' => 'datetime',
            'read_at' => 'datetime',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'recipient_user_id'
        );
    }
}