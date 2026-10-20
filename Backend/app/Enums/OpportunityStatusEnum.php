<?php

namespace App\Enums;

enum OpportunityStatusEnum: string
{
    case OPEN = 'open';
    case WON = 'won';
    case LOST = 'lost';
}