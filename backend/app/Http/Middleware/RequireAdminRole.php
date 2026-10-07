<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAdminRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->attributes->get('current_user');

        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền khóa tài khoản người dùng.',
            ], 403);
        }

        return $next($request);
    }
}
