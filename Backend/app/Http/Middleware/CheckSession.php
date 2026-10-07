<?php

namespace App\Http\Middleware;

use App\Services\SessionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSession
{
    public function __construct(
        private SessionService $sessionService
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        // Lấy token từ Authorization: Bearer ...
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'code' => 'SESSION_EXPIRED',
                'message' => 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            ], 401);
        }

        // Kiểm tra phiên
        $session = $this->sessionService->validate($token);

        if (!$session) {
            return response()->json([
                'success' => false,
                'code' => 'SESSION_EXPIRED',
                'message' => 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            ], 401);
        }

        // Lấy user của phiên
        $user = $session->user;

        if (!$user) {
            return response()->json([
                'success' => false,
                'code' => 'SESSION_EXPIRED',
                'message' => 'Không tìm thấy người dùng của phiên đăng nhập.',
            ], 401);
        }

        // Có hoạt động thì gia hạn phiên
        $this->sessionService->refresh($session);

        // Truyền session và user sang controller
        $request->attributes->set(
            'current_session',
            $session
        );

        $request->attributes->set(
            'current_user',
            $user
        );

        return $next($request);
    }
}