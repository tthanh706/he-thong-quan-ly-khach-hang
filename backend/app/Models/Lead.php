<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadScoringConfig extends Model
{
    protected $fillable = ['criteria_key', 'criteria_value', 'score'];
}