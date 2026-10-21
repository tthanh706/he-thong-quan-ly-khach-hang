<?php

namespace App\Enums;

enum ContractStatusEnum: string
{
    case ACTIVE = 'active';
    case EXPIRED = 'expired';
    case CANCELLED = 'cancelled';
    case RENEWED = 'renewed';
}