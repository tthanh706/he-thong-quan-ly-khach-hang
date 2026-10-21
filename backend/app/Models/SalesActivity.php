<?php

namespace App\Models;

use App\Enums\SalesActivityTypeEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesActivity extends Model
{
    protected $fillable = [
        'user_id',
        'team_leader_id',
        'lead_id',
        'customer_id',
        'contact_id',
        'opportunity_id',
        'activity_type',
        'title',
        'description',
        'duration_minutes',
        'result',
        'call_result',
        'callback_at',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'activity_type' => SalesActivityTypeEnum::class,
            'duration_minutes' => 'integer',
            'occurred_at' => 'datetime',
            'callback_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function teamLeader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'team_leader_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class, 'opportunity_id');
    }
}