<?php

namespace App\Enums;

/**
 * Vai tro trong he thong. Giong voi type `Role` o front-end (src/types/index.ts).
 */
enum Role: string
{
    case EMPLOYEE = 'employee';
    case TEAM_LEAD = 'team_lead';
    case DIRECTOR = 'director';

    public function label(): string
    {
        return match ($this) {
            self::EMPLOYEE => 'Nhân viên kinh doanh',
            self::TEAM_LEAD => 'Trưởng nhóm',
            self::DIRECTOR => 'Giám đốc kinh doanh',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(static fn (self $role): string => $role->value, self::cases());
    }
}
