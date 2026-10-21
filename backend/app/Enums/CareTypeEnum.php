<?php

namespace App\Enums;

enum CareTypeEnum: string
{
    case ROUTINE_CHECK = 'Kiểm tra định kỳ';
    case SYSTEM_MAINTENANCE = 'Bảo trì định kỳ';
    case SATISFACTION_SURVEY = 'Thăm hỏi & Khảo sát';
    case CONTRACT_RENEWAL = 'Tư vấn tái ký';
}
