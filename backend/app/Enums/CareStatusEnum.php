<?php

namespace App\Enums;

enum CareStatusEnum: string
{
    case PENDING = 'PENDING';
    case IN_PROGRESS = 'IN_PROGRESS';
    case DONE = 'DONE';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match($this) {
            self::PENDING => 'Chưa thực hiện',
            self::IN_PROGRESS => 'Đang thực hiện',
            self::DONE => 'Đã hoàn thành',
            self::CANCELLED => 'Đã hủy',
        };
    }
}
