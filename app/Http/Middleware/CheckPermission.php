<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

/**
 * Middleware mẫu: chặn truy cập route khi user không có quyền,
 * ném AuthorizationException -> Handler::render() sẽ bắt và
 * hiển thị trang lỗi 403 dùng chung (SCRUM-91).
 *
 * Đăng ký trong app/Http/Kernel.php:
 *   'permission' => \App\Http\Middleware\CheckPermission::class,
 *
 * Sử dụng trên route:
 *   Route::middleware('permission:manage-users')->group(...);
 */
class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission)
    {
        $user = $request->user();

        if (! $user || ! $user->can($permission)) {
            throw new AuthorizationException(
                "Bạn không có quyền [{$permission}] để thực hiện thao tác này."
            );
        }

        return $next($request);
    }
}
