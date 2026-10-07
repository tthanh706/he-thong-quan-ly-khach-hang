<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class SessionService
{
    // Phiên hết hạn sau 30 phút không hoạt động
    private int $sessionMinutes = 30;

    public function create(User $user): UserSession
    {
        return UserSession::create([
            'user_id' => $user->id,
            'token' => hash('sha256', Str::random(80)),
            'last_activity' => Carbon::now(),
            'expires_at' => Carbon::now()->addMinutes($this->sessionMinutes),
            'revoked' => false,
        ]);
    }

    public function validate(string $token): ?UserSession
    {
        $session = UserSession::where('token', $token)->first();

        if (!$session) {
            return null;
        }

        // Phiên đã bị đăng xuất
        if ($session->revoked) {
            return null;
        }

        // Phiên đã hết hạn
        if (Carbon::now()->greaterThan($session->expires_at)) {
            return null;
        }

        return $session;
    }

    public function refresh(UserSession $session): void
    {
        // Có hoạt động thì gia hạn thêm 30 phút
        $session->last_activity = Carbon::now();
        $session->expires_at = Carbon::now()->addMinutes($this->sessionMinutes);
        $session->save();
    }

    public function revoke(UserSession $session): void
    {
        // Đăng xuất thì vô hiệu phiên ngay
        $session->revoked = true;
        $session->save();
    }
}