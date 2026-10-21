<?php

namespace App\Enums;

enum CareStatusEnum: string
{
    case PENDING = 'PENDING';
    case DONE = 'DONE';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Chưa thực hiện',
            self::DONE => 'Đã hoàn thành',
            self::CANCELLED => 'Đã hủy',
        };
    }
}
