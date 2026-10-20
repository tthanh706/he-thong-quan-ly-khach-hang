<?php

namespace App\Enums;

enum CalendarItemTypeEnum: string
{
    case MEETING = 'meeting';
    case TASK = 'task';
}