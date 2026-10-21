<?php

namespace App\Enums;

enum CampaignChannelEnum: string
{
    case FACEBOOK = 'facebook';
    case GOOGLE = 'google';
    case EMAIL = 'email';
    case ZALO = 'zalo';
    case WEBSITE = 'website';
    case OFFLINE = 'offline';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::FACEBOOK => 'Facebook Ads',
            self::GOOGLE => 'Google Ads',
            self::EMAIL => 'Email Marketing',
            self::ZALO => 'Zalo OA / Zalo Ads',
            self::WEBSITE => 'Website / SEO',
            self::OFFLINE => 'Offline / Event',
            self::OTHER => 'Khác',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}