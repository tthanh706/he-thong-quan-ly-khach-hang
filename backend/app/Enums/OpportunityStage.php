<?php

namespace App\Enums;

enum OpportunityStage: string
{
    case PROSPECTING = 'prospecting';
    case QUALIFIED = 'qualified';
    case PROPOSAL = 'proposal';
    case NEGOTIATION = 'negotiation';
    case WON = 'won';
    case LOST = 'lost';

    public function label(): string
    {
        return match ($this) {
            self::PROSPECTING => 'Tìm kiếm',
            self::QUALIFIED => 'Đã xác định',
            self::PROPOSAL => 'Đề xuất',
            self::NEGOTIATION => 'Đàm phán',
            self::WON => 'Thắng',
            self::LOST => 'Thua',
        };
    }
}
