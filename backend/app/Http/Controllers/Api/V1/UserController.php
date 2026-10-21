<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateUserRoleRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {
    }

    public function updateRole(
        UpdateUserRoleRequest $request,
        User $user
    ): JsonResponse {
        $currentUser = $request->attributes->get('current_user');

        if (!$currentUser) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Phiên đăng nhập không hợp lệ.',
            ], 401);
        }

        $updatedUser = $this->userService->updateRole(
            $user,
            $request->validated('role'),
            $currentUser
        );

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $updatedUser->id,
                'name' => $updatedUser->name,
                'email' => $updatedUser->email,
                'role' => $updatedUser->role,
            ],
            'message' => 'Cập nhật vai trò thành công.',
        ]);
    }
}