<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserService
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    ) {
    }

    public function updateRole(
        User $targetUser,
        string $newRole,
        User $currentUser
    ): User {
        return DB::transaction(function () use (
            $targetUser,
            $newRole,
            $currentUser
        ) {
            $oldRole = $targetUser->role;

            if ($oldRole === $newRole) {
                return $targetUser;
            }

            $targetUser->role = $newRole;
            $targetUser->save();

            $this->auditLogService->logChange(
                $currentUser->id,
                'updated',
                'User',
                $targetUser->id,
                'role',
                $oldRole,
                $newRole
            );

            return $targetUser->fresh();
        });
    }
}