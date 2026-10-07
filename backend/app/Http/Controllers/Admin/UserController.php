<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * UserController – dành riêng cho Admin quản lý tài khoản.
 * Route phải được bảo vệ bằng middleware 'permission:manage-users'.
 * Nếu không đủ quyền -> CheckPermission ném AuthorizationException -> 403.
 */
class UserController extends Controller
{
    /**
     * Danh sách tất cả user.
     */
    public function index(Request $request): View
    {
        $users = User::query()
                     ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")
                                                                ->orWhere('email', 'like', "%{$s}%"))
                     ->when($request->role, fn ($q, $r) => $q->where('role', $r))
                     ->latest()
                     ->paginate(20);

        return view('admin.users.index', compact('users'));
    }

    /**
     * Kích hoạt / vô hiệu hoá tài khoản user.
     */
    public function toggleActive(Request $request, int $id): RedirectResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => ! $user->is_active]);

        $status = $user->is_active ? 'kích hoạt' : 'vô hiệu hoá';

        return back()->with('success', "Tài khoản {$user->name} đã được {$status}.");
    }

    /**
     * Thay đổi vai trò user.
     */
    public function changeRole(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'role' => ['required', 'in:admin,manager,staff'],
        ]);

        $user = User::findOrFail($id);
        $user->update(['role' => $request->role]);

        return back()->with('success', "Vai trò của {$user->name} đã được cập nhật.");
    }
}
