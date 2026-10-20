<?php

namespace App\Enums;

enum LeadAssignmentActionEnum: string
{
    case ASSIGNED = 'assigned';
    case ACCEPTED = 'accepted';
    case REJECTED = 'rejected';
    case CONTACTED = 'contacted';
    case SLA_OVERDUE = 'sla_overdue';
}