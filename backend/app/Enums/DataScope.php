<?php

namespace App\Enums;

/**
 * Pham vi du lieu: cua toi / cua nhom toi / tat ca. Giong voi type `Scope` o front-end.
 */
enum DataScope: string
{
    case OWN = 'own';
    case TEAM = 'team';
    case ALL = 'all';

    public function label(): string
    {
        return match ($this) {
            self::OWN => 'Dữ liệu của tôi',
            self::TEAM => 'Dữ liệu của nhóm tôi',
            self::ALL => 'Toàn bộ dữ liệu',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(static fn (self $scope): string => $scope->value, self::cases());
    }
}
