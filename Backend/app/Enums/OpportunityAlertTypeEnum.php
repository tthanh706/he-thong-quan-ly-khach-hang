<?php

namespace App\Enums;

enum OpportunityAlertTypeEnum: string
{
    case STAGNANT = 'stagnant';
    case OVERDUE_CLOSE = 'overdue_close';
}