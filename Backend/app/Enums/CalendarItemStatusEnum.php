<?php

namespace App\Enums;

enum CalendarItemStatusEnum: string
{
    case SCHEDULED = 'scheduled';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
}