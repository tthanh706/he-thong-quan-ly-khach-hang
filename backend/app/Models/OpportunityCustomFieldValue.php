<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpportunityCustomFieldValue extends Model
{
    protected $fillable = [
        'opportunity_id',
        'custom_field_id',
        'field_value',
    ];

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(
            Opportunity::class,
            'opportunity_id'
        );
    }

    public function customField(): BelongsTo
    {
        return $this->belongsTo(
            OpportunityCustomField::class,
            'custom_field_id'
        );
    }
}