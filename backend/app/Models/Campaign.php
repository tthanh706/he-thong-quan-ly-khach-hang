<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campaign extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'channel',
        'status',       // 'draft' | 'active' | 'paused' | 'completed'
        'starts_at',
        'ends_at',
        'budget',
        'target_leads',
        'target_revenue',
        'created_by',   // FK -> users.id
        'customer_id',  // FK -> customers.id (nullable)
    ];

    protected $casts = [
        'starts_at'      => 'datetime',
        'ends_at'        => 'datetime',
        'budget'         => 'decimal:2',
        'target_revenue' => 'decimal:2',
        'target_leads'   => 'integer',
        'deleted_at'     => 'datetime',
    ];

    /** Người tạo chiến dịch */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Khách hàng gắn với chiến dịch (có thể null) */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /** Danh sách lead thu được từ chiến dịch (S4-03) */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'campaign_id');
    }

    /** Danh sách cơ hội bán hàng từ chiến dịch (S4-03) */
    public function opportunities(): HasMany
    {
        return $this->hasMany(Opportunity::class, 'campaign_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByCreator($query, int $userId)
    {
        return $query->where('created_by', $userId);
    }
}
