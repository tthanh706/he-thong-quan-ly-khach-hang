<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OpportunityCustomField extends Model
{
    protected $fillable = [
        'name',
        'field_key',
        'field_type',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function values(): HasMany
    {
        return $this->hasMany(
            OpportunityCustomFieldValue::class,
            'custom_field_id'
        );
    }
}