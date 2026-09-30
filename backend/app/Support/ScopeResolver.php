<?php

namespace App\Support;

use App\Enums\DataScope;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Lop truy cap du lieu co gan pham vi so huu.
 *
 * Moi truy van danh sach deu di qua day: khong co noi nao tu do loc du lieu theo vai tro.
 */
final class ScopeResolver
{
    /**
     * Ghep dieu kien pham vi vao truy van danh sach.
     *
     *  - own : ban ghi do chinh nguoi dung so huu
     *  - team: ban ghi cua minh + ban ghi cua cac thanh vien cung nhom
     *  - all : moi ban ghi trong he thong
     */
    public function apply(Builder $query, User $user, DataScope $scope): Builder
    {
        $ownerColumn = $query->getModel()->qualifyColumn('owner_id');
        $teamColumn = $query->getModel()->qualifyColumn('team_id');

        return match ($scope) {
            DataScope::OWN => $query->where($ownerColumn, $user->id),
            DataScope::TEAM => $query->where(function (Builder $inner) use ($ownerColumn, $teamColumn, $user): void {
                $inner->where($ownerColumn, $user->id)
                    ->orWhere($teamColumn, $user->team_id);
            }),
            DataScope::ALL => $query,
        };
    }

    /**
     * Ban ghi co nam trong pham vi cua nguoi dang dang nhap hay khong (row-level).
     */
    public function isRecordInScope(User $user, DataScope $scope, object $record): bool
    {
        $ownerId = (int) $record->owner_id;
        $teamId = (int) $record->team_id;

        if ($ownerId === (int) $user->id) {
            return true;
        }

        return match ($scope) {
            DataScope::ALL => true,
            DataScope::TEAM => $teamId === (int) $user->team_id,
            DataScope::OWN => false,
        };
    }

    /**
     * Pham vi hieu luc cua nguoi dang dang nhap: doc tu request, fallback ve mac dinh theo vai tro.
     */
    public function currentScope(User $user, ?string $requested): DataScope
    {
        return PermissionMatrix::resolveScope($user->role, $requested);
    }
}
