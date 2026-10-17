<?php

namespace App\Enums;

enum ContractAlertTypeEnum: string
{
    case EXPIRING_SOON = 'expiring_soon';
    case EXPIRED = 'expired';
}