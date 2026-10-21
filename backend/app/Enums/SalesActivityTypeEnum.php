<?php

namespace App\Enums;

enum SalesActivityTypeEnum: string
{
    case CALL = 'call';
    case MEETING = 'meeting';
    case EMAIL = 'email';
    case NOTE = 'note';
    case QUOTATION = 'quotation';
}