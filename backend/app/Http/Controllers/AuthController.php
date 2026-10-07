<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(private SessionService $sessionService) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->input('email'))->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return response()->json(['message' => 'Email hoặc mật khẩu không đúng.'], 422);
        }

        if ($user->isLocked()) {
            return response()->json(['message' => 'Tài khoản đã bị khóa, không thể đăng nhập.'], 423);
        }

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
}
