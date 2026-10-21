<?php

namespace App\Enums;

enum LeadStatusEnum: string
{
    case WAITING_ASSIGNMENT = 'waiting_assignment';
    case ASSIGNED = 'assigned';
    case CARING = 'caring';
}