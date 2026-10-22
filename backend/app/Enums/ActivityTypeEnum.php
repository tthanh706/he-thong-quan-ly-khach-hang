<?php

namespace App\Enums;

enum ActivityTypeEnum: string
{
    CASE CALL = 'call';
    CASE MEETING = 'meeting';
    CASE EMAIL = 'email';
    CASE NOTE = 'note';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}