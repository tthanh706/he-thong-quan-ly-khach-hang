<?php

namespace App\Enums;

enum ActivityStatus: string
{
    case TODO = 'todo';
    case DONE = 'done';
    case OVERDUE = 'overdue';

    public function label(): string
    {
        return match ($this) {
            self::TODO => 'Chờ xử lý',
            self::DONE => 'Đã hoàn thành',
            self::OVERDUE => 'Quá hạn',
        };
    }
}
