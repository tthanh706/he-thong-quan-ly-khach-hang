<?php

namespace App\Support;

use App\Enums\DataScope;
use App\Enums\Role;

/**
 * Ma tran phan quyen theo vai tro (RBAC).
 *
 * Quyen cap vai tro chi quyet dinh "duoc phep lam gi";
 * moi thao tac doc/ghi ban ghi con bi chan them boi pham vi du lieu so huu (Data Scope).
 */
final class PermissionMatrix
{
    /** @var array<string, array<string, bool>> */
    private const MATRIX = [
        'employee' => [
            Action::VIEW => true,
            Action::CREATE => true,
            Action::EDIT => true,
            Action::DELETE => false,
            Action::EXPORT => true,
        ],
        'team_lead' => [
            Action::VIEW => true,
            Action::CREATE => true,
            Action::EDIT => true,
            Action::DELETE => true,
            Action::EXPORT => true,
        ],
        'director' => [
            Action::VIEW => true,
            Action::CREATE => true,
            Action::EDIT => true,
            Action::DELETE => true,
            Action::EXPORT => true,
        ],
    ];

    /** Pham vi mac dinh cua tung vai tro */
    private const DEFAULT_SCOPE = [
        'employee' => DataScope::OWN,
        'team_lead' => DataScope::TEAM,
        'director' => DataScope::ALL,
    ];

    /** Cac pham vi ma vai tro duoc phep chon tren giao dien */
    private const ALLOWED_SCOPES = [
        'employee' => [DataScope::OWN],
        'team_lead' => [DataScope::OWN, DataScope::TEAM],
        'director' => [DataScope::OWN, DataScope::TEAM, DataScope::ALL],
    ];

    public static function allows(Role $role, string $action): bool
    {
        return self::MATRIX[$role->value][$action] ?? false;
    }

    public static function defaultScope(Role $role): DataScope
    {
        return self::DEFAULT_SCOPE[$role->value];
    }

    /** @return array<int, DataScope> */
    public static function allowedScopes(Role $role): array
    {
        return self::ALLOWED_SCOPES[$role->value];
    }

    /**
     * Chong nang quyen: nguoi dung chi duoc chon pham vi ma vai tro cho phep.
     * Yeu cau ngoai danh sach cho phep se bi ha ve pham vi mac dinh cua vai tro.
     */
    public static function resolveScope(Role $role, ?string $requested): DataScope
    {
        $allowed = self::allowedScopes($role);

        if ($requested !== null && $requested !== '' && $requested !== 'auto') {
            $scope = DataScope::tryFrom($requested);

            if ($scope !== null && in_array($scope, $allowed, true)) {
                return $scope;
            }
        }

        return self::defaultScope($role);
    }

    /**
     * Ma tran phan quyen + danh sach pham vi cho phep, gui ve front-end de hien thi len giao dien.
     *
     * @return array<string, mixed>
     */
    public static function describe(Role $role): array
    {
        $permissions = [];
        foreach (Action::values() as $action) {
            $permissions[$action] = self::allows($role, $action);
        }

        return [
            'role' => $role->value,
            'role_label' => $role->label(),
            'permissions' => $permissions,
            'default_scope' => self::defaultScope($role)->value,
            'default_scope_label' => self::defaultScope($role)->label(),
            'allowed_scopes' => array_map(
                static fn (DataScope $scope): array => [
                    'value' => $scope->value,
                    'label' => $scope->label(),
                ],
                self::allowedScopes($role),
            ),
        ];
    }
}
