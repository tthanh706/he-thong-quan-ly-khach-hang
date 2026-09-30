<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\PermissionMatrix;
use App\Support\ScopeResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly ScopeResolver $scopeResolver) {}

    /** Dang nhap, tra ve token + thong tin phan quyen cua tai khoan. */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = \App\Models\User::query()->with('team')->where('email', $credentials['email'])->first();

        if ($user === null || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Thông tin đăng nhập không đúng.',
            ]);
        }

        $scope = $this->scopeResolver->currentScope($user, $request->input('scope'));

        return response()->json([
            'token' => $user->createToken('crm-scrum-5')->plainTextToken,
            'user' => $this->presentUser($user),
            'permissions' => PermissionMatrix::describe($user->role),
            'scope' => [
                'value' => $scope->value,
                'label' => $scope->label(),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('team');
        $scope = $this->scopeResolver->currentScope($user, $request->header('X-Data-Scope'));

        return response()->json([
            'user' => $this->presentUser($user),
            'permissions' => PermissionMatrix::describe($user->role),
            'scope' => [
                'value' => $scope->value,
                'label' => $scope->label(),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Đã đăng xuất.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function presentUser(\App\Models\User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'title' => $user->title,
            'role' => $user->role->value,
            'role_label' => $user->role->label(),
            'team_id' => $user->team_id,
            'team_name' => $user->team?->name,
            'avatar_color' => $user->avatar_color,
        ];
    }
}
