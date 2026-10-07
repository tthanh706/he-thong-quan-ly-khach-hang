<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AuthController (API / Sanctum)
 *
 * Lỗi 401 từ AuthenticationException được Handler::renderJson() bắt
 * và trả về JSON chuẩn (SCRUM-91).
 */
class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    /**
     * POST /api/login – Đăng nhập và lấy API token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user  = $this->authService->login($request->validated()); // -> 401 nếu sai
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data'    => [
                'token' => $token,
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role,
                ],
            ],
            'message' => 'Đăng nhập thành công.',
        ]);
    }

    /**
     * POST /api/logout – Thu hồi token hiện tại.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công.',
        ]);
    }

    /**
     * GET /api/me – Lấy thông tin user đang đăng nhập.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $request->user(),
        ]);
    }
}
