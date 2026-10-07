<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use App\Services\SessionService;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService,
        private SessionService $sessionService
    ) {
    }

    public function login(LoginRequest $request)
    {
        // Xử lý đăng nhập
        $result = $this->authService->login(
            $request->email,
            $request->password
        );

        // Nếu đăng nhập thất bại
        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], $result['status']);
        }

        // Lấy thông tin user sau khi đăng nhập thành công
        $user = $result['user'];

        // Tạo phiên đăng nhập mới phía server
        $session = $this->sessionService->create($user);

        // Xác định trang chuyển hướng theo vai trò
        $redirect = match ($user->role) {
            'admin' => '/admin/dashboard',
            'staff' => '/dashboard',
            default => '/dashboard',
        };

        // Trả dữ liệu về Frontend
        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công.',

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],

            // Token phiên để Frontend gửi lại ở các request sau
            'session_token' => $session->token,

            // Thời điểm phiên hết hạn
            'expires_at' => $session->expires_at,

            // Trang tương ứng với vai trò
            'redirect' => $redirect,
        ]);
    }
}