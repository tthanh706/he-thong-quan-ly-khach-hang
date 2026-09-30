<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLogin()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Tìm tài khoản theo email
        $user = User::where('email', $request->email)->first();

        // Tài khoản đã bị khóa bởi quản trị viên
        if ($user && ! $user->is_active) {
            return back()->withErrors([
                'email' => 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
            ])->withInput($request->only('email'));
        }

        // Kiểm tra tài khoản đang bị khóa tạm thời
        if ($user && $user->locked_until && now()->lessThan($user->locked_until)) {
            return back()->withErrors([
                'email' => 'Tài khoản đang tạm khóa. Vui lòng thử lại sau 15 phút.',
            ])->withInput($request->only('email'));
        }

        // Kiểm tra email + mật khẩu
        if (! $user || ! Hash::check($request->password, $user->password)) {

            // Nếu có tài khoản thì tăng số lần đăng nhập sai
            if ($user) {
                $user->failed_login_attempts++;

                // Sai 5 lần → khóa 15 phút
                if ($user->failed_login_attempts >= 5) {
                    $user->locked_until = now()->addMinutes(15);
                    $user->save();

                    return back()->withErrors([
                        'email' => 'Tài khoản đã bị khóa tạm thời do đăng nhập sai quá nhiều lần.',
                    ])->withInput($request->only('email'));
                }

                $user->save();
            }

            return back()->withErrors([
                'email' => 'Email hoặc mật khẩu không chính xác.',
            ])->withInput($request->only('email'));
        }

        // Đăng nhập thành công → reset bộ đếm
        $user->failed_login_attempts = 0;
        $user->locked_until = null;
        $user->save();

        // Tạo session mới để chống session fixation
        $request->session()->regenerate();

        Auth::login($user);

        // Chuyển trang theo role
        if ($user->role === 'admin') {
            return redirect('/admin');
        }

        return redirect('/dashboard');
    }

    public function logout(Request $request)
    {
        Auth::logout();

        // Hủy session hiện tại trên server
        $request->session()->invalidate();

        // Tạo CSRF token mới
        $request->session()->regenerateToken();

        return redirect('/login')->with(
            'success',
            'Bạn đã đăng xuất thành công.'
        );
    }
}
