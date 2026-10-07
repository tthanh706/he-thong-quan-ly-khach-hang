<?php

declare(strict_types=1);

namespace App\Enums;

enum CategoryTypeEnum: string
{
    case LEAD_SOURCE = 'LEAD_SOURCE';
    case INDUSTRY = 'INDUSTRY';
    case BUSINESS_TYPE = 'BUSINESS_TYPE';
}
