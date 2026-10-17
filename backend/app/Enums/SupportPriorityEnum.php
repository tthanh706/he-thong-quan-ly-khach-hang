<?php

namespace App\Enums;

enum SupportPriorityEnum: string
{
    case LOW = 'LOW';
    case MEDIUM = 'MEDIUM';
    case HIGH = 'HIGH';

    public function label(): string
    {
        return match ($this) {
            self::LOW => 'Thấp (Low)',
            self::MEDIUM => 'Trung bình (Medium)',
            self::HIGH => 'Cao (High)',
        };
    }
}
