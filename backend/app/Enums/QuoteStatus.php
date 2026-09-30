<?php

namespace App\Enums;

enum QuoteStatus: string
{
    case DRAFT = 'draft';
    case SENT = 'sent';
    case ACCEPTED = 'accepted';
    case REJECTED = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Nháp',
            self::SENT => 'Đã gửi',
            self::ACCEPTED => 'Đã chấp nhận',
            self::REJECTED => 'Bị từ chối',
        };
    }
}
