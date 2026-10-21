<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpportunityAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'opportunity_id',
        'file_name',
        'original_name',
        'file_path',
        'mime_type',
        'file_size',
        'disk',
        'uploaded_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    /**
     * Maximum file size in bytes (20MB).
     */
    public const MAX_FILE_SIZE = 20 * 1024 * 1024;

    /**
     * Maximum file size for validation rule string.
     */
    public const MAX_FILE_SIZE_KB = 20480; // 20MB in KB

    // ─── Relationships ─────────────────────────────────────────────

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(Opportunity::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // ─── Accessors ──────────────────────────────────────────────────

    /**
     * Human-readable file size.
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;

        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 2) . ' MB';
        }

        if ($bytes >= 1024) {
            return round($bytes / 1024, 2) . ' KB';
        }

        return $bytes . ' B';
    }
}
