<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Services\SessionService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(private SessionService $sessionService) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->input('email'))->first();

        // 1. Kiểm tra khóa vĩnh viễn
        if ($user && $user->isLocked()) {
            return response()->json(['message' => 'Tài khoản đã bị quản trị viên khóa, không thể đăng nhập.'], 423);
        }

        // 2. Kiểm tra khóa tạm thời do nhập sai nhiều lần
        if ($user && $user->locked_until && Carbon::now()->lessThan($user->locked_until)) {
            $diffMinutes = Carbon::now()->diffInMinutes($user->locked_until, false) + 1;
            return response()->json([
                'message' => "Tài khoản đang bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau {$diffMinutes} phút."
            ], 423);
        }

        // 3. Kiểm tra thông tin đăng nhập
        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            if ($user) {
                $user->failed_login_attempts = ($user->failed_login_attempts ?? 0) + 1;
                if ($user->failed_login_attempts >= 5) {
                    $user->locked_until = Carbon::now()->addMinutes(15);
                    $user->save();
                    return response()->json([
                        'message' => 'Bạn đã nhập sai mật khẩu 5 lần liên tiếp. Tài khoản đã bị tạm khóa trong 15 phút để bảo mật.'
                    ], 423);
                }
                $user->save();
            }

            return response()->json(['message' => 'Email hoặc mật khẩu không đúng.'], 422);
        }

        // 4. Đăng nhập thành công -> Reset bộ đếm lỗi & thời gian khóa
        $user->failed_login_attempts = 0;
        $user->locked_until = null;
        $user->save();

        $session = $this->sessionService->create($user);

        return response()->json([
            'success' => true,
            'session_token' => $session->token,
            'user' => $user,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $session = $request->attributes->get('current_session');
        if ($session) {
            $this->sessionService->revoke($session);
        }

        return response()->json(['success' => true, 'message' => 'Đã đăng xuất.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'user' => $request->attributes->get('current_user'),
        ]);
    }

    /**
     * Yêu cầu đặt lại mật khẩu (Quên mật khẩu)
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
        ]);

        $user = User::where('email', $request->input('email'))->first();

        // Theo chuẩn S1-03: Email không tồn tại vẫn hiển thị cùng một thông báo để bảo mật
        if (!$user) {
            return response()->json([
                'success' => true,
                'message' => 'Nếu email tồn tại trong hệ thống, hướng dẫn và mã đặt lại mật khẩu đã được gửi đến bạn.',
            ]);
        }

        $token = Str::random(60);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => $token,
                'created_at' => Carbon::now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Nếu email tồn tại trong hệ thống, hướng dẫn và mã đặt lại mật khẩu đã được gửi đến bạn.',
            'token' => $token,
        ]);
    }

    /**
     * Xác nhận đặt lại mật khẩu mới với mã xác thực
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[A-Za-z])(?=.*\d)/',
                'confirmed'
            ],
        ], [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email' => 'Địa chỉ email không hợp lệ.',
            'token.required' => 'Mã xác nhận không được để trống.',
            'password.required' => 'Vui lòng nhập mật khẩu mới.',
            'password.min' => 'Mật khẩu mới phải có tối thiểu 8 ký tự.',
            'password.regex' => 'Mật khẩu phải chứa ít nhất một chữ cái và một chữ số.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->input('email'))
            ->first();

        if (!$record || $record->token !== $request->input('token')) {
            return response()->json([
                'message' => 'Mã xác nhận hoặc email không chính xác.'
            ], 422);
        }

        // S1-03: Liên kết đặt lại có hiệu lực 30 phút
        if (Carbon::parse($record->created_at)->addMinutes(30)->isPast()) {
            return response()->json([
                'message' => 'Mã xác nhận đã hết hạn (chỉ có hiệu lực trong vòng 30 phút).'
            ], 422);
        }

        $user = User::where('email', $request->input('email'))->firstOrFail();
        $user->password = Hash::make($request->input('password'));
        $user->failed_login_attempts = 0;
        $user->locked_until = null;
        $user->save();

        // S1-03: Liên kết chỉ dùng được một lần
        DB::table('password_reset_tokens')
            ->where('email', $request->input('email'))
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.',
        ]);
    }

    /**
     * Đổi mật khẩu cho người dùng đang đăng nhập
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[A-Za-z])(?=.*\d)/',
                'confirmed'
            ],
        ], [
            'current_password.required' => 'Vui lòng nhập mật khẩu hiện tại.',
            'new_password.required' => 'Vui lòng nhập mật khẩu mới.',
            'new_password.min' => 'Mật khẩu mới phải có tối thiểu 8 ký tự.',
            'new_password.regex' => 'Mật khẩu mới phải chứa ít nhất một chữ cái và một chữ số.',
            'new_password.confirmed' => 'Mật khẩu xác nhận không khớp.',
        ]);

        /** @var User $currentUser */
        $currentUser = $request->attributes->get('current_user');

        if (!$currentUser || !Hash::check($request->input('current_password'), $currentUser->password)) {
            return response()->json([
                'message' => 'Mật khẩu hiện tại không chính xác.'
            ], 422);
        }

        $currentUser->password = Hash::make($request->input('new_password'));
        $currentUser->save();

        // S1-04: Đổi xong thu hồi các phiên đăng nhập khác
        $currentSession = $request->attributes->get('current_session');
        try {
            \App\Models\UserSession::where('user_id', $currentUser->id)
                ->when($currentSession, fn ($q) => $q->where('id', '!=', $currentSession->id))
                ->update(['revoked' => true]);
        } catch (\Throwable) {}

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công và đã thu hồi các phiên đăng nhập khác!',
        ]);
    }
}
