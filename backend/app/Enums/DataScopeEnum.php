<?php

declare(strict_types=1);

namespace App\Enums;

enum DataScopeEnum: string
{
    case MY = 'MY';
    case TEAM = 'TEAM';
    case ALL = 'ALL';

    public function label(): string
    {
        return match ($this) {
            self::MY => 'Dữ liệu cá nhân (MY)',
            self::TEAM => 'Dữ liệu nhóm (TEAM)',
            self::ALL => 'Toàn bộ dữ liệu (ALL)',
        };
    }
}
