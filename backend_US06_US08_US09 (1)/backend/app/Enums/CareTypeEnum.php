<?php

namespace App\Enums;

enum CareTypeEnum: string
{
    case SYSTEM_MAINTENANCE = 'Bảo trì hệ thống định kỳ';
    case SATISFACTION_SURVEY = 'Thăm hỏi & Khảo sát hài lòng';
    case CONTRACT_RENEWAL = 'Gia hạn hợp đồng / dịch vụ';

    public function label(): string
    {
        return $this->value;
    }
}
