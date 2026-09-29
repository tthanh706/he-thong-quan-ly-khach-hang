<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class MenuController extends Controller
{
    public function me(): JsonResponse
    {
        $user = Auth::user();

        $menus = collect(config('menu', []))
            ->filter(fn (array $item) => in_array($user->role, $item['roles'], true))
            ->values()
            ->all();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_label' => $this->roleLabel($user->role),
                'business_group' => $user->business_group,
            ],
            'menus' => $menus,
        ]);
    }

    private function roleLabel(string $role): string
    {
        return match ($role) {
            'admin' => 'Quản trị viên',
            'manager' => 'Quản lý kinh doanh',
            'sales' => 'Nhân viên kinh doanh',
            default => 'Người dùng',
        };
    }
}
