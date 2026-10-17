<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpportunityHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'opportunity_id',
        'field_name',
        'field_label',
        'old_value',
        'new_value',
        'old_label',
        'new_label',
        'changed_by_user_id',
        'reason',
    ];

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class, 'opportunity_id');
    }

    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
