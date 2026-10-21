<?php

namespace App\Enums;

enum SupportStatusEnum: string
{
    case OPEN = 'OPEN';
    case IN_PROGRESS = 'IN_PROGRESS';
    case CLOSED = 'CLOSED';

    public function label(): string
    {
        return match ($this) {
            self::OPEN => 'Mới tiếp nhận',
            self::IN_PROGRESS => 'Đang xử lý',
            self::CLOSED => 'Đã hoàn thành',
        };
    }
}
