<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class WebForm extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'embed_token',
        'source',
        'title',
        'description',
        'submit_button_text',
        'success_message',
        'is_active',
        'submission_count',
        'rate_limit_per_minute',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'submission_count' => 'integer',
            'rate_limit_per_minute' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (WebForm $form) {
            if (empty($form->code)) {
                $form->code = 'WF-' . strtoupper(Str::random(6));
            }
            if (empty($form->embed_token)) {
                $form->embed_token = Str::random(40);
            }
            if (empty($form->submit_button_text)) {
                $form->submit_button_text = 'Gửi thông tin';
            }
            if (empty($form->success_message)) {
                $form->success_message = 'Cảm ơn bạn đã gửi thông tin. Chuyên viên tư vấn sẽ liên hệ với bạn trong thời gian sớm nhất!';
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'web_form_id');
    }
}
