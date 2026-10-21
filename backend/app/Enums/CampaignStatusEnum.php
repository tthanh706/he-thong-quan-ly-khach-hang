<?php

namespace App\Enums;

enum CampaignStatusEnum: string
{
    case DRAFT = 'draft';
    case ACTIVE = 'active';
    case PAUSED = 'paused';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Nháp',
            self::ACTIVE => 'Đang chạy',
            self::PAUSED => 'Tạm dừng',
            self::COMPLETED => 'Hoàn thành',
            self::CANCELLED => 'Đã hủy',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}