<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLogin()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        // Kiểm tra dữ liệu nhập vào
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Tìm tài khoản theo email
        $user = User::where('email', $request->email)->first();

        // Nếu tài khoản tồn tại và đang bị khóa
        if ($user && $user->locked_until && now()->lessThan($user->locked_until)) {
            return back()->withErrors([
                'email' => 'Tài khoản đang tạm khóa. Vui lòng thử lại sau 15 phút.',
            ])->withInput($request->only('email'));
        }
// Kiểm tra email + mật khẩu
if (!$user || !Hash::check($request->password, $user->password)) {

    // Nếu có tài khoản thì tăng số lần đăng nhập sai
    if ($user) {
        $user->failed_login_attempts++;

        // Sai 5 lần → khóa 15 phút
        if ($user->failed_login_attempts >= 5) {
            $user->locked_until = now()->addMinutes(15);
            $user->save();

            return back()->withErrors([
                'email' => 'Tài khoản đã bị khóa tạm thời trong 15 phút do đăng nhập sai quá nhiều lần.',
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

        return redirect('/login')->with('success', 'Bạn đã đăng xuất thành công.');
    }
    //ADD*
    // CHỨC NĂNG ĐỔI MẬT KHẨU (SCRUM-88)
    

    // 1. Hiển thị trang đổi mật khẩu
    public function showChangePassword()
    {
        return view('auth.change-password');
    }

    // 2. Xử lý đổi mật khẩu
    public function changePassword(Request $request)
    {
        // Validate dữ liệu theo yêu cầu SCRUM-88
        $request->validate([
            'current_password' => ['required'], // Bắt buộc nhập mật khẩu hiện tại
            'new_password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->numbers() // Tối thiểu 8 ký tự, có chữ và số
            ],
        ], [
            'current_password.required' => 'Vui lòng nhập mật khẩu hiện tại.',
            'new_password.required' => 'Vui lòng nhập mật khẩu mới.',
            'new_password.min' => 'Mật khẩu mới phải có tối thiểu 8 ký tự.',
            'new_password.confirmed' => 'Mật khẩu xác nhận không khớp.',
        ]);

        $user = Auth::user();

        // Kiểm tra mật khẩu hiện tại có đúng không
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Mật khẩu hiện tại không chính xác.']);
        }

        // Cập nhật mật khẩu mới vào DB
        $user->password = Hash::make($request->new_password);
        $user->save();

        // Thu hồi các phiên đăng nhập khác
        Auth::logoutOtherDevices($request->current_password);

        return redirect()->back()->with('status', 'Đổi mật khẩu thành công và đã đăng xuất khỏi các thiết bị khác!');
    }
}