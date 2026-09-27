<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendResetLinkRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\PasswordResetToken;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ForgotPasswordController extends Controller
{
    /**
     * Thông báo trung tính dùng chung cho mọi phản hồi gửi email (Anti-User Enumeration)
     */
    protected string $genericResponseText = 'Nếu địa chỉ email của bạn tồn tại trên hệ thống, chúng tôi đã gửi một liên kết hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (bao gồm cả mục thư rác/spam).';

    /**
     * Màn hình 1: Hiển thị form Quên mật khẩu
     */
    public function showLinkRequestForm()
    {
        return view('auth.forgot-password');
    }

    /**
     * Xử lý gửi email liên kết khôi phục (Chống dò địa chỉ email)
     */
    public function sendResetLinkEmail(SendResetLinkRequest $request)
    {
        $email = strtolower(trim($request->input('email')));
        $user  = User::where('email', $email)->first();

        // Nếu email TỒN TẠI trên hệ thống
        if ($user) {
            // Tạo token mới có hạn 30 phút trong CSDL
            [$rawToken, $tokenRecord] = PasswordResetToken::createTokenForEmail(
                $email,
                $request->ip()
            );

            // Gửi email chứa liên kết dạng async
            $user->notify(new ResetPasswordNotification($rawToken));
        }

        // BẢO MẬT CHỐNG DÒ EMAIL (ANTI-USER ENUMERATION):
        // Dù email CÓ hay KHÔNG TỒN TẠI, hệ thống LUÔN hiển thị CÙNG 1 thông báo thành công.
        return back()->with('status', $this->genericResponseText);
    }

    /**
     * Màn hình 2: Hiển thị form Nhập mật khẩu mới từ liên kết Email
     */
    public function showResetForm(Request $request, string $token)
    {
        $hashedToken = hash('sha256', $token);
        $record = PasswordResetToken::where('token', $hashedToken)->first();

        // 1. Kiểm tra Token có tồn tại trong CSDL không
        if (!$record) {
            return redirect()->route('password.request')->withErrors([
                'email' => 'Liên kết đặt lại mật khẩu không hợp lệ hoặc không tồn tại.',
            ]);
        }

        // 2. YÊU CẦU: Kiểm tra tính dùng 1 lần (Single-use token)
        if ($record->isUsed()) {
            return redirect()->route('password.request')->withErrors([
                'email' => 'Liên kết đặt lại mật khẩu này đã được sử dụng trước đó. Vui lòng gửi yêu cầu mới.',
            ]);
        }

        // 3. YÊU CẦU: Kiểm tra thời hạn hiệu lực 30 phút
        if ($record->isExpired()) {
            return redirect()->route('password.request')->withErrors([
                'email' => 'Liên kết đã hết hạn (chỉ có hiệu lực trong 30 phút). Vui lòng gửi yêu cầu mới.',
            ]);
        }

        return view('auth.reset-password', [
            'token' => $token,
            'email' => $request->query('email', $record->email),
            'expires_at' => $record->expires_at,
        ]);
    }

    /**
     * Xử lý cập nhật mật khẩu mới
     */
    public function reset(ResetPasswordRequest $request)
    {
        $hashedToken = hash('sha256', $request->token);
        $record = PasswordResetToken::where('token', $hashedToken)
            ->where('email', $request->email)
            ->first();

        // Validate Token lần nữa trước khi cập nhật
        if (!$record || $record->isUsed() || $record->isExpired()) {
            return back()->withErrors([
                'email' => 'Liên kết khôi phục đã hết hạn hoặc đã được sử dụng.',
            ]);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return back()->withErrors(['email' => 'Không tìm thấy tài khoản tương ứng.']);
        }

        // 1. Cập nhật mật khẩu mới (Mã hóa Hash::make)
        $user->forceFill([
            'password' => Hash::make($request->password),
        ])->save();

        // 2. YÊU CẦU: Đánh dấu token đã được sử dụng (Vô hiệu hóa ngay lập tức)
        $record->markAsUsed();

        // 3. Vô hiệu hóa toàn bộ phiên đăng nhập cũ trên thiết bị khác
        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete(); // Thu hồi Personal Access / Refresh Tokens
        }

        return redirect()->route('login')->with('status', 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
    }
}
