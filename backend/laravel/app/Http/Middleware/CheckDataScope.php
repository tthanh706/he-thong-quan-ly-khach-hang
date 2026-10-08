<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\DataScopeEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckDataScope
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ?string $requiredScope = null): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa xác thực người dùng.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Attach user data scope to request context
        $userScope = $user->data_scope ?? DataScopeEnum::MY;
        $request->attributes->set('data_scope', $userScope);

        if ($requiredScope !== null && $userScope->value !== $requiredScope && $userScope !== DataScopeEnum::ALL) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập phạm vi dữ liệu này.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
