<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

/**
 * AuthService
 *
 * Xử lý toàn bộ logic xác thực: đăng nhập, đăng xuất, lấy user hiện tại.
 * Nếu xác thực thất bại, ném AuthenticationException -> Handler bắt -> 401.
 */
class AuthService
{
    /**
     * Đăng nhập user bằng email + password.
     *
     * @param  array{email: string, password: string, remember?: bool} $credentials
     * @return User
     *
     * @throws AuthenticationException  Nếu thông tin đăng nhập không hợp lệ.
     */
    public function login(array $credentials): User
    {
        $remember = $credentials['remember'] ?? false;

        if (! Auth::attempt([
            'email'    => $credentials['email'],
            'password' => $credentials['password'],
            'is_active' => true,
        ], $remember)) {
            throw new AuthenticationException('Email hoặc mật khẩu không đúng.');
        }

        /** @var User $user */
        $user = Auth::user();

        // Regenerate session để tránh session fixation
        request()->session()->regenerate();

        return $user;
    }

    /**
     * Đăng xuất user hiện tại và xoá session.
     */
    public function logout(): void
    {
        Auth::logout();

        request()->session()->invalidate();
        request()->session()->regenerateToken();
    }

    /**
     * Trả về user đang đăng nhập.
     *
     * @throws AuthenticationException  Nếu chưa đăng nhập.
     */
    public function currentUser(): User
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            throw new AuthenticationException('Bạn chưa đăng nhập.');
        }

        return $user;
    }

    /**
     * Đổi mật khẩu cho user hiện tại.
     *
     * @throws AuthenticationException  Nếu mật khẩu cũ không đúng.
     */
    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw new AuthenticationException('Mật khẩu hiện tại không đúng.');
        }

        $user->update(['password' => $newPassword]);
    }
}
