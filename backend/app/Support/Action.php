<?php

namespace App\Support;

use App\Enums\Role;

/**
 * Hanh dong duoc kiem soat boi RBAC. Giong voi type `Action` o front-end.
 */
final class Action
{
    public const VIEW = 'view';

    public const CREATE = 'create';

    public const EDIT = 'edit';

    public const DELETE = 'delete';

    public const EXPORT = 'export';

    /** @return array<int, string> */
    public static function values(): array
    {
        return [self::VIEW, self::CREATE, self::EDIT, self::DELETE, self::EXPORT];
    }
}
