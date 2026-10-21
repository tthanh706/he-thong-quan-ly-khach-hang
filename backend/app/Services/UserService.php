<?php

namespace App\Services;

use App\Mail\UserActivationMail;
use App\Models\User;
use App\Models\UserActivationToken;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class UserService
{
    private ?AuditLogService $auditLogService = null;

    public function __construct(?AuditLogService $auditLogService = null)
    {
        $this->auditLogService = $auditLogService ?? app(AuditLogService::class);
    }

    public function list(array $filters): LengthAwarePaginator
    {
        $query = User::query();
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('business_group', 'like', "%{$search}%");
            });
        }
        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        return $query->orderBy('id', 'desc')->paginate(20)->withQueryString();
    }

    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $tempPassword = $this->temporaryPassword();
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $tempPassword,
                'business_group' => $data['business_group'] ?? null,
                'role' => $data['role'],
                'status' => 'pending',
            ]);
            $plainToken = Str::random(64);
            UserActivationToken::create([
                'user_id' => $user->id,
                'token_hash' => hash('sha256', $plainToken),
                'expires_at' => now()->addDay(),
            ]);
            $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
            $url = $frontend . '/activate?token=' . urlencode($plainToken);
            Mail::to($user->email)->send(new UserActivationMail($user, $tempPassword, $url));
            return $user;
        });
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh();
    }

    public function activate(string $plainToken): User
    {
        $record = UserActivationToken::with('user')
            ->where('token_hash', hash('sha256', $plainToken))
            ->whereNull('used_at')
            ->first();
        if (!$record || now()->greaterThan($record->expires_at)) {
            abort(422, 'Liên kết kích hoạt không hợp lệ hoặc đã hết hạn.');
        }
        $record->user->update(['status' => 'active', 'activated_at' => now()]);
        $record->update(['used_at' => now()]);
        return $record->user;
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

    private function temporaryPassword(): string
    {
        return 'Tmp' . Str::upper(Str::random(4)) . random_int(1000, 9999) . 'a1';
    }
}
