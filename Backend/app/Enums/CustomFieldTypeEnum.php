<?php

namespace App\Enums;

enum CustomFieldTypeEnum: string
{
    case TEXT = 'text';
    case NUMBER = 'number';
    case DATE = 'date';
    case SELECT = 'select';
}