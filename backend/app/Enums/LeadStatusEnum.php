<?php

namespace App\Enums;

enum LeadStatusEnum: string
{
    case NEW = 'new';
    case WAITING_ASSIGNMENT = 'waiting_assignment';
    case ASSIGNED = 'assigned';
    case CARING = 'caring';
    case CONVERTED = 'converted';
    case MERGED = 'merged';
}