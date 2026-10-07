<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;

class AuthService
{
    public function login(string $email, string $password): array
    {
        // Tìm người dùng theo email
        $user = User::where('email', $email)->first();

        // Nếu tài khoản đang bị khóa
        if ($user && $user->locked_until) {
            if (Carbon::now()->lessThan($user->locked_until)) {
                return [
                    'success' => false,
                    'status' => 429,
                    'message' => 'Tài khoản tạm thời bị khóa. Vui lòng thử lại sau 15 phút.',
                ];
            }

            // Nếu đã hết thời gian khóa thì reset
            $user->failed_login_attempts = 0;
            $user->locked_until = null;
            $user->save();
        }

        // Email không tồn tại hoặc mật khẩu sai
        if (!$user || !Hash::check($password, $user->password)) {

            // Chỉ tăng số lần sai nếu email tồn tại
            if ($user) {
                $user->failed_login_attempts++;

                // Sai đủ 5 lần thì khóa 15 phút
                if ($user->failed_login_attempts >= 5) {
                    $user->locked_until = Carbon::now()->addMinutes(15);
                }

                $user->save();
            }

            return [
                'success' => false,
                'status' => 401,
                'message' => 'Email hoặc mật khẩu không chính xác.',
            ];
        }

        // Đăng nhập đúng thì reset số lần sai
        $user->failed_login_attempts = 0;
        $user->locked_until = null;
        $user->save();

        return [
            'success' => true,
            'status' => 200,
            'message' => 'Đăng nhập thành công.',
            'user' => $user,
        ];
    }
}