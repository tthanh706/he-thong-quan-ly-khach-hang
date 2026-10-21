<?php

namespace App\Enums;

enum LeadAssignmentActionEnum: string
{
    case CREATED = 'created';
    case ASSIGNED = 'assigned';
    case ACCEPTED = 'accepted';
    case REJECTED = 'rejected';
    case CONTACTED = 'contacted';
    case SLA_OVERDUE = 'sla_overdue';
    case CONVERTED = 'converted';
    case MERGED = 'merged';
}