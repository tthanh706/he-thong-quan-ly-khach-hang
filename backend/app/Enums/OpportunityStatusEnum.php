<?php

namespace App\Enums;

enum OpportunityStatusEnum: string
{
    case OPEN = 'open';
    case QUALIFIED = 'qualified';
    case WON = 'won';
    case LOST = 'lost';
}