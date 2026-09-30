<?php

namespace App\Enums;

enum ActivityType: string
{
    case CALL = 'call';
    case MEETING = 'meeting';
    case EMAIL = 'email';
    case VISIT = 'visit';

    public function label(): string
    {
        return match ($this) {
            self::CALL => 'Cuộc gọi',
            self::MEETING => 'Cuộc họp',
            self::EMAIL => 'Email',
            self::VISIT => 'Thăm khách',
        };
    }
}
