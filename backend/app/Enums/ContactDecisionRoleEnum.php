<?php

namespace App\Enums;

enum ContactDecisionRoleEnum: string
{
    case DECISION_MAKER = 'decision_maker';
    case INFLUENCER = 'influencer';
    case END_USER = 'end_user';
    case BLOCKER = 'blocker';
}