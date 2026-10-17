<?php

namespace App\Enums;

enum SalesActivityTypeEnum: string
{
    case CALL = 'call';
    case MEETING = 'meeting';
    case QUOTATION = 'quotation';
}