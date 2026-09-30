<?php

namespace App\Enums;

enum CustomerStatus: string
{
    case LEAD = 'lead';
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';

    public function label(): string
    {
        return match ($this) {
            self::LEAD => 'Tiềm năng',
            self::ACTIVE => 'Đang phục vụ',
            self::INACTIVE => 'Ngừng hoạt động',
        };
    }
}
